// Snap behaviour test: scrolls the real page to a clock time, waits for scrub + snap to settle,
// and reports where the clock came to rest. Run: playwright-cli run-code --filename=scripts/snaptest.js
async (page) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const out = [];
  const go = async (label, target, expect) => {
    await page.evaluate((v) => window.__afrika.scrollTo(v), target);
    await wait(4200); // scrub (1s) + snap delay (0.2s) + snap glide (up to 1.6s) + margin
    const t = await page.evaluate(() => window.__afrika.t());
    const y = await page.evaluate(() => window.__afrika.scrollY());
    const ok = Math.abs(t - expect) < 0.6;
    out.push(`${ok ? 'PASS' : 'FAIL'}  ${label}: scrolled to t=${target}, came to rest at t=${t.toFixed(2)} (y=${y}px), expected ${expect}`);
  };
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(1500);
  await go('inside pool never snaps', 10, 10);
  await go('after the drop, glides to tennis', 35, 40);
  await go('inside tennis never snaps', 48, 48);
  await go('after the last hit, glides to darts', 62, 72);
  await go('after the bullseye, glides to end', 90, 100);
  await go('scrolling back, bullseye zone stays free', 88, 88);
  await go('scrolling back into smash zone, returns to ready', 65, 56);
  await go('scrolling back into drop zone, returns to rim', 35, 30);
  return out.join('\n');
}
