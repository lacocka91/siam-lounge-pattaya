/* Globe language picker: pointer, keyboard, ARIA and responsive checks.
   Requires the local preview, Chrome and Playwright (or SIAM_PLAYWRIGHT_MODULE).
   SIAM_QA_SCREENSHOTS optionally writes to an existing screenshot directory. */
'use strict';
const { chromium } = require(process.env.SIAM_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [], reports = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('http://127.0.0.1:4173/');
    const toggle = page.locator('#language-toggle'), menu = page.locator('#language-menu');
    const option = lang => menu.locator('[data-language="' + lang + '"]');
    const focused = async lang => assert.ok(await option(lang).evaluate(el => document.activeElement === el));
    const closed = async (returnedFocus = false) => {
      await page.waitForFunction(() => document.getElementById('language-menu').hidden);
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.ok(await menu.locator('button').evaluateAll(buttons => buttons.every(button => button.tabIndex === -1)));
      if (returnedFocus) assert.ok(await toggle.evaluate(el => document.activeElement === el));
    };
    const selected = async lang => {
      assert.equal(await page.locator('html').getAttribute('lang'), lang);
      assert.equal(await menu.locator('[aria-checked="true"]').count(), 1);
      assert.equal(await option(lang).getAttribute('aria-checked'), 'true');
      assert.equal(await toggle.getAttribute('aria-label'), await page.evaluate(() => Siam.t('language.label')));
      assert.equal(await page.title(), await page.evaluate(() => Siam.t('meta.title')));
      assert.equal(await page.locator('#language-status').textContent(), await page.evaluate(() => Siam.t('language.changed')));
      assert.equal(await page.evaluate(() => localStorage.getItem('siam-lounge-language')), lang);
      assert.ok(await page.locator('#main-nav [data-i18n], .quick-actions [data-i18n]').evaluateAll(elements => elements.every(el => el.textContent === Siam.t(el.dataset.i18n))));
      assert.ok(await page.locator('dialog [data-language]').evaluateAll(buttons => buttons.every(button => button.getAttribute('aria-pressed') === String(button.dataset.language === document.documentElement.lang))));
    };
    assert.equal(await toggle.getAttribute('aria-haspopup'), 'menu');
    assert.equal(await toggle.getAttribute('aria-controls'), 'language-menu');
    assert.equal(await menu.getAttribute('aria-labelledby'), 'language-toggle');
    assert.equal(await menu.getAttribute('role'), 'menu');
    assert.deepEqual(await menu.locator('button').allTextContents(), ['EN', 'DE', 'ไทย']);
    assert.equal(await menu.locator('[role="menuitemradio"]').count(), 3);
    await closed();
    for (const [width, height] of [[320, 568], [390, 844], [667, 375], [1024, 900], [1440, 900], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      for (const lang of ['en', 'de', 'th']) {
        await toggle.click();
        await option(lang).click();
        await selected(lang); await closed(true);
        await toggle.click(); await focused(lang);
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        const layout = await menu.evaluate(el => {
          const r = el.getBoundingClientRect(), t = document.getElementById('language-toggle').getBoundingClientRect();
          const checked = el.querySelector('[aria-checked="true"]');
          const other = el.querySelector('[aria-checked="false"]');
          return {
            fits: r.left >= 0 && r.right <= innerWidth && r.top >= t.bottom && r.bottom <= innerHeight,
            noOverflow: el.scrollWidth <= el.clientWidth && document.documentElement.scrollWidth <= innerWidth,
            touch: t.width >= 44 && t.height >= 44 && [...el.querySelectorAll('button')].every(button => button.getBoundingClientRect().height >= 44),
            marked: getComputedStyle(checked).color !== getComputedStyle(other).color && getComputedStyle(checked).fontWeight !== getComputedStyle(other).fontWeight
          };
        });
        assert.ok(Object.values(layout).every(Boolean), JSON.stringify({ width, lang, layout }));
        if (process.env.SIAM_QA_SCREENSHOTS && [320, 1440].includes(width)) await page.screenshot({ path: path.join(process.env.SIAM_QA_SCREENSHOTS, 'language-' + lang + '-' + width + '.png') });
        await page.keyboard.press('Escape'); await closed(true);
      }
      // Pointer toggle and clicking outside close the dropdown.
      await toggle.click(); await toggle.click(); await closed(true);
      await toggle.click(); await page.locator('.site-header .brand').click(); await closed();
      // Keyboard opening, wrapping, Home/End and native button activation.
      await toggle.focus(); await page.keyboard.press('ArrowDown'); await focused('en');
      await page.keyboard.press('ArrowUp'); await focused('th');
      await page.keyboard.press('Home'); await focused('en');
      await page.keyboard.press('End'); await focused('th');
      await page.keyboard.press('ArrowUp'); await focused('de');
      await page.keyboard.press('Enter'); await selected('de'); await closed(true);
      await page.keyboard.press('Space'); await focused('de');
      await page.keyboard.press('ArrowDown'); await focused('th');
      await page.keyboard.press('Space'); await selected('th'); await closed(true);
      await page.keyboard.press('ArrowUp'); await focused('th');
      await page.keyboard.press('Shift+Tab'); await closed(true);
      await page.keyboard.press('Enter'); await focused('th');
      await page.keyboard.press('Tab'); await closed();
      assert.ok(await page.evaluate(() => !document.querySelector('.language-picker').contains(document.activeElement)));
      if (width < 1024) {
        await page.locator('.menu-toggle').click();
        await toggle.click(); await page.keyboard.press('Escape'); await closed(true);
        assert.ok(await page.locator('#main-nav').isVisible(), 'First Escape should only close the language dropdown');
        await page.keyboard.press('Escape');
        assert.ok(await page.locator('#main-nav').isHidden());
        await toggle.click(); await page.locator('.menu-toggle').click(); await closed();
        await page.keyboard.press('Escape');
      }
      reports.push(width + 'px: EN/DE/Thai, active state, ARIA, mouse, keyboard, outside click, Escape and no overflow');
    }
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'), 'th');
    await closed();
    // Existing dialog controls still update the same site-wide language state.
    await page.locator('.hero [data-open-dialog="table-dialog"]').click();
    await page.locator('#table-dialog [data-language="en"]').click();
    await selected('en');
    await page.keyboard.press('Escape');
    await toggle.click(); await focused('en');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ reports, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
