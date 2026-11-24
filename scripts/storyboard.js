// Storyboard: renders the story at fixed clock times and saves one PNG per time into ./storyboard.
// Run with the dev server up:  playwright-cli run-code --filename=scripts/storyboard.js
// (run-code has no Node modules: only page.evaluate and page.screenshot are used.)
async (page) => {
  const times = [0, 8, 16, 24, 29, 30, 33, 35, 36, 38, 40, 42, 44.5, 47, 52, 58, 62, 65, 67, 70, 72, 78, 84, 85, 88, 92, 100];
  for (const t of times) {
    await page.evaluate((time) => window.__afrika.seek(time), t);
    // Two frames, so the render and any layout settle before the screenshot.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({ path: `storyboard/t${t.toFixed(1).padStart(5, '0')}.png` });
  }
  return `${times.length} frames in storyboard/`;
}
