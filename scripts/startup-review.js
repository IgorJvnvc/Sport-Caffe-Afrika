// Run against Vite dev with playwright-cli run-code --filename=scripts/startup-review.js.
async (page) => {
  let release;
  const wait = new Promise((resolve) => { release = resolve; });
  const entry = /\/src\/main\.ts(?:\?.*)?$/;
  await page.route(entry, async (route) => {
    await wait;
    await route.continue();
  });
  await page.goto(page.url(), { waitUntil: 'commit' });
  try {
    await page.locator('#loading').waitFor({ state: 'visible' });
    await page.locator('main').waitFor({ state: 'hidden' });
    await page.screenshot({ path: 'storyboard/startup-loading.png' });
  } finally {
    release();
  }
  await page.locator('#loading').waitFor({ state: 'hidden' });
  await page.locator('main').waitFor({ state: 'visible' });
  const frame = await page.evaluate(() => window.__afrika?.info());
  if (!frame?.calls) throw new Error('Loading view disappeared before the 3D frame rendered');
  await page.screenshot({ path: 'storyboard/startup-ready.png' });
  await page.unroute(entry);
  await page.route(entry, (route) => route.abort());
  await page.reload();
  await page.locator('[data-story-unavailable] main').waitFor({ state: 'visible' });
  await page.locator('#loading').waitFor({ state: 'hidden' });
  await page.unroute(entry);
  return 'Loading view held until first render; failed import revealed static content';
}
