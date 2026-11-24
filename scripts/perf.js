// Perf sample: draw calls / triangles per scene, then frame cadence during a scripted scroll through the whole story.
// Run: playwright-cli run-code --filename=scripts/perf.js
async (page) => {
  const scenes = {};
  for (const t of [0, 29, 40, 58, 78, 85]) {
    await page.evaluate((v) => window.__afrika.seek(v), t);
    scenes[`t${t}`] = await page.evaluate(() => window.__afrika.info());
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 1500));
  const sweep = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const total = 6300;
        const dur = 6000;
        const t0 = performance.now();
        const dts = [];
        let last = t0;
        const step = (now) => {
          dts.push(now - last);
          last = now;
          const p = Math.min(1, (now - t0) / dur);
          window.scrollTo(0, p * total);
          if (p < 1) requestAnimationFrame(step);
          else {
            dts.sort((a, b) => a - b);
            resolve({
              frames: dts.length,
              avgMs: +(dts.reduce((s, v) => s + v, 0) / dts.length).toFixed(2),
              p95Ms: +dts[Math.floor(dts.length * 0.95)].toFixed(2),
              maxMs: +dts[dts.length - 1].toFixed(2),
            });
          }
        };
        requestAnimationFrame(step);
      }),
  );
  return JSON.stringify({ scenes, sweep }, null, 1);
}
