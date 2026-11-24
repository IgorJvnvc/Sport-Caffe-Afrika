// Run against the Vite dev server with playwright-cli run-code --filename=scripts/table-review.js.
async (page) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.reload();
    await page.waitForFunction(() => !!window.__afrika);
    for (const time of [0, 30, 33, 35, 40, 47, 58, 72, 78, 84, 100]) {
      const frame = await page.evaluate((t) => {
        window.__afrika.seek(t);
        return { scene: document.querySelector('#story').dataset.scene, calls: window.__afrika.info().calls };
      }, time);
      if (frame.scene !== (time < 36 ? 'pool' : time < 67 ? 'tennis' : 'darts') || frame.calls < 1) throw new Error(`Invalid frame at ${time}`);
      await page.screenshot({ path: `storyboard/tables-${width}-${time}.png` });
    }
  }
  await page.evaluate(() => window.__afrika.scrollTo(35));
  await page.waitForFunction(() => Math.abs(window.__afrika.t() - 40) < 0.05);
  await page.evaluate(() => window.__afrika.scrollTo(35));
  await page.waitForFunction(() => Math.abs(window.__afrika.t() - 30) < 0.05);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => !window.__afrika && !document.querySelector('.pin-spacer'));
  await page.screenshot({ path: 'storyboard/tables-reduced-motion.png' });
  if (errors.length) throw new Error(errors.join('\n'));
  return 'Equipment frames captured at both widths; pocket snap passed both ways; reduced motion removed the pin; no page errors';
}
