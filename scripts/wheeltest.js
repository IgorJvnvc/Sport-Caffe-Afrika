// Wheel test: real mouse-wheel input instead of programmatic scrolling. Run: playwright-cli run-code --filename=scripts/wheeltest.js
async (page) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const out = [];
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(1500);
  await page.mouse.move(720, 450);
  const wheel = async (total, step = 100, gap = 16) => {
    const dir = Math.sign(total);
    for (let d = 0; d < Math.abs(total); d += step) {
      await page.mouse.wheel(0, dir * step);
      await wait(gap);
    }
  };
  const rest = async (label, expect) => {
    await wait(4200);
    const [t, y] = await page.evaluate(() => [window.__afrika.t(), window.__afrika.scrollY()]);
    out.push(`${Math.abs(t - expect) < 0.6 ? 'PASS' : 'FAIL'}  ${label}: rest t=${t.toFixed(2)} (y=${y}px), expected ${expect}`);
  };
  await wheel(2200);
  await rest('flick to just past the pocket drop, glides to tennis', 40);
  await wheel(500);
  await rest('a slow nudge inside the rally stays put', 47.9);
  await wheel(-300);
  await rest('scrolling back inside the rally stays put', 43.2);
  await wheel(1500);
  await rest('flick into the smash zone, glides to darts', 72);
  return out.join('\n');
}
