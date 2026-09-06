const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:4300/add-nota');
  await page.waitForSelector('.titulo-input');
  await page.screenshot({ path: 'C:/Users/jully/AppData/Local/Temp/claude/c--Users-jully-OneDrive-Desktop-lembre-me/9a9eee52-b6d1-42bc-bf6e-b8e3ddf99641/scratchpad/add-nota.png' });

  const cardBox = await page.locator('.add-card').boundingBox();
  const itemBox = await page.locator('.titulo-item').boundingBox();
  const wrapperBox = await page.locator('.titulo-wrapper').boundingBox();
  const inputBox = await page.locator('.titulo-input').boundingBox();

  console.log('card:', cardBox);
  console.log('item:', itemBox);
  console.log('wrapper:', wrapperBox);
  console.log('input:', inputBox);

  // Type some text to see where it visually sits
  await page.fill('.titulo-input', 'Teste de titulo');
  await page.screenshot({ path: 'C:/Users/jully/AppData/Local/Temp/claude/c--Users-jully-OneDrive-Desktop-lembre-me/9a9eee52-b6d1-42bc-bf6e-b8e3ddf99641/scratchpad/add-nota-filled.png' });

  const styles = await page.locator('.titulo-input').evaluate(el => {
    const cs = getComputedStyle(el);
    return { paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight, textAlign: cs.textAlign, width: cs.width, boxSizing: cs.boxSizing };
  });
  console.log('input styles:', styles);

  const itemInnerBox = await page.locator('.titulo-item').evaluate(el => {
    const inner = el.shadowRoot ? el.shadowRoot.querySelector('.item-native') : null;
    if (!inner) return null;
    const rect = inner.getBoundingClientRect();
    const cs = getComputedStyle(inner);
    return { rect: { x: rect.x, width: rect.width }, paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight };
  });
  console.log('item-native:', itemInnerBox);

  await browser.close();
})();
