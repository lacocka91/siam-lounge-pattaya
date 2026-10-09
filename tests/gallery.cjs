/* Gallery interaction checks against scripts/preview.cjs.
   Requires Playwright and Chrome; no production dependencies.
   Optional: SIAM_PLAYWRIGHT_MODULE and SIAM_QA_SCREENSHOTS. */
'use strict';
const { chromium } = require(process.env.SIAM_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const base = 'http://127.0.0.1:4173/';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [], reports = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(base);
    const items = await page.evaluate(() => SIAM_DATA.gallery);
    const main = page.locator('.gallery-main-open');
    const selected = () => main.getAttribute('data-gallery-id');
    const selectCategory = category => page.locator('[data-gallery-filter="' + category + '"]').click();
    for (const language of ['en', 'de', 'th']) {
      const priorId = await selected();
      await page.locator('#language-toggle').click();
      await page.locator('#language-menu [data-language="' + language + '"]').click();
      assert.equal(await selected(), priorId, 'Language change lost selected photo');
      for (const width of [320, 390, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: width < 768 ? 740 : 1000 });
        await page.waitForFunction(() => document.querySelector('.menu-toggle').hidden === (innerWidth >= 1024));
        await selectCategory('all');
        await page.locator('.gallery-thumbnail').first().click();
        await page.locator('.gallery-next').click(); assert.equal(await selected(), items[1].id);
        await page.locator('.gallery-previous').click(); assert.equal(await selected(), items[0].id);
        await page.locator('.gallery-previous').click(); assert.equal(await selected(), items.at(-1).id);
        await page.locator('.gallery-next').click(); assert.equal(await selected(), items[0].id);
        await page.locator('.gallery-thumbnail').last().click();
        assert.equal(await selected(), items.at(-1).id);
        await page.keyboard.press('Home'); assert.equal(await selected(), items[0].id);
        await page.keyboard.press('End'); assert.equal(await selected(), items.at(-1).id);
        await page.keyboard.press('ArrowLeft'); assert.equal(await selected(), items.at(-2).id);
        const layout = await page.evaluate(() => {
          const active = document.querySelector('.gallery-thumbnail[aria-pressed="true"]');
          const strip = document.querySelector('.gallery-thumbnails').getBoundingClientRect();
          const preview = active.getBoundingClientRect();
          const image = document.querySelector('.gallery-main-image');
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            activeCount: document.querySelectorAll('.gallery-thumbnail[aria-pressed="true"]').length,
            focusOnActive: document.activeElement === active,
            previewVisible: preview.left >= strip.left - 1 && preview.right <= strip.right + 1,
            fit: getComputedStyle(image).objectFit,
            frame: image.getBoundingClientRect().toJSON(),
            targets: [...document.querySelectorAll('.gallery-arrow,.gallery-thumbnail')].every(button => button.getBoundingClientRect().width >= 44 && button.getBoundingClientRect().height >= 44),
            labels: document.querySelector('.gallery-next').getAttribute('aria-label') === Siam.t('gallery.next') && document.querySelector('.gallery-previous').getAttribute('aria-label') === Siam.t('gallery.previous'),
            alt: image.alt === Siam.localize(SIAM_DATA.gallery.find(item => item.id === active.dataset.galleryThumb).alt)
          };
        });
        assert.ok(!layout.overflow && layout.activeCount === 1 && layout.focusOnActive && layout.previewVisible && layout.targets && layout.labels && layout.alt, JSON.stringify({ language, width, layout }));
        assert.equal(layout.fit, 'contain');
        assert.ok(layout.frame.left >= 0 && layout.frame.right <= width);
        for (const category of ['food', 'central', 'pratumnak', 'stay', 'events']) {
          await selectCategory(category);
          const entries = items.filter(item => item.category === category);
          assert.equal(await page.locator('.gallery-thumbnail').count(), entries.length);
          const currentId = await selected();
          assert.ok(entries.some(item => item.id === currentId));
          assert.equal(await page.locator('.gallery-next').isDisabled(), entries.length === 1);
          assert.equal(await page.locator('.gallery-previous').isDisabled(), entries.length === 1);
          assert.equal(await page.locator('[data-gallery-filter="' + category + '"]').getAttribute('aria-pressed'), 'true');
          if (entries.length > 1) {
            await page.locator('.gallery-next').click();
            const nextId = await selected();
            assert.notEqual(nextId, currentId);
            assert.ok(entries.some(item => item.id === nextId));
          }
        }
        await selectCategory('all');
        await page.locator('.gallery-thumbnail').first().click();
        if ([320, 1440].includes(width)) {
          await main.focus(); await page.keyboard.press('Enter');
          await page.waitForFunction(() => document.querySelector('#lightbox-dialog').open);
          assert.equal(await page.locator('.lightbox-image').getAttribute('alt'), items[0].alt[language]);
          await page.keyboard.press('Tab');
          assert.ok(await page.evaluate(() => !!document.activeElement.closest('#lightbox-dialog')));
          await page.locator('#lightbox-dialog .dialog-close').focus();
          await page.keyboard.press('Tab');
          assert.ok(await page.evaluate(() => !!document.activeElement.closest('#lightbox-dialog')));
          await page.keyboard.press('Escape');
          await page.waitForFunction(() => !document.querySelector('#lightbox-dialog').open && document.activeElement.matches('.gallery-main-open'));
        }
        if (process.env.SIAM_QA_SCREENSHOTS && ((language === 'en' && [768, 1440].includes(width)) || (language === 'de' && width === 320) || (language === 'th' && width === 390))) {
          await page.locator('.gallery-main-image').evaluate(image => image.decode());
          await page.locator('#gallery').screenshot({
            path: path.join(process.env.SIAM_QA_SCREENSHOTS, 'gallery-' + language + '-' + width + '.png'),
            animations: 'disabled', style: '.site-header,.quick-actions,.skip-link { visibility: hidden !important; }'
          });
        }
      }
      reports.push(language + ': arrows, wraparound, previews, active marker, keyboard, categories and layout at 320/390/768/1024/1440/1920');
    }
    await main.click();
    const beforeLanguage = await selected();
    await page.locator('#lightbox-dialog [data-language="de"]').click();
    assert.equal(await selected(), beforeLanguage);
    assert.equal(await page.locator('.lightbox-image').getAttribute('alt'), items.find(item => item.id === beforeLanguage).alt.de);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement.matches('.gallery-main-open'));
    reports.push('Lightbox: Enter, focus containment, Escape, focus return and language change preserve selection');

    // Real browser touch input exercises pointer cancellation, native scrolling
    // and the synthesized tap after a swipe (not just dispatched JS events).
    for (const width of [320, 390, 768]) {
      const context = await browser.newContext({ viewport: { width, height: width < 768 ? 740 : 1024 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      const touchPage = await context.newPage();
      touchPage.on('pageerror', error => errors.push(error.message));
      const client = await context.newCDPSession(touchPage);
      await touchPage.goto(base);
      const touchMain = touchPage.locator('.gallery-main-open');
      const id = () => touchMain.getAttribute('data-gallery-id');
      const swipe = async (dx, dy = 0) => {
        await touchMain.scrollIntoViewIfNeeded();
        const r = await touchMain.boundingBox();
        const x = r.x + r.width / 2 - dx / 2, y = r.y + r.height / 2 - dy / 2;
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        for (let step = 1; step <= 6; step++) {
          await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * step / 6, y: y + dy * step / 6 }] });
          await touchPage.evaluate(() => new Promise(requestAnimationFrame));
        }
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      };
      for (const language of ['en', 'de', 'th']) {
        // Start each touch scenario at rest; a preceding gesture can still have
        // native scroll momentum when the next scenario reaches the header.
        await touchPage.goto(base);
        await touchPage.locator('#language-toggle').tap();
        await touchPage.locator('#language-menu [data-language="' + language + '"]').tap();
        await touchPage.locator('[data-gallery-filter="all"]').tap();
        await touchPage.locator('.gallery-thumbnail').first().tap();
        await swipe(-120);
        assert.equal(await id(), items[1].id, 'Left swipe failed: ' + width + '/' + language);
        assert.equal(await touchPage.locator('#lightbox-dialog').evaluate(dialog => dialog.open), false, 'Swipe accidentally opened lightbox');
        await swipe(120);
        assert.equal(await id(), items[0].id, 'Right swipe failed');
        await swipe(-18);
        assert.equal(await id(), items[0].id, 'Short motion changed photo');
        if (await touchPage.locator('#lightbox-dialog').evaluate(dialog => dialog.open)) {
          await touchPage.locator('#lightbox-dialog .dialog-close').tap();
          await touchPage.waitForFunction(() => !document.querySelector('#lightbox-dialog').open);
        }
        const beforeScroll = await touchPage.evaluate(() => scrollY);
        await swipe(0, -90);
        await touchPage.waitForFunction(y => scrollY !== y, beforeScroll);
        assert.equal(await id(), items[0].id, 'Vertical scrolling changed photo');
        assert.equal(await touchPage.locator('#lightbox-dialog').evaluate(dialog => dialog.open), false);
        await touchMain.tap();
        await touchPage.waitForFunction(() => document.querySelector('#lightbox-dialog').open);
        await touchPage.locator('#lightbox-dialog .dialog-close').tap();
        await touchPage.waitForFunction(() => !document.querySelector('#lightbox-dialog').open);
        await touchPage.locator('[data-gallery-filter="food"]').tap();
        await swipe(-120);
        assert.equal(await id(), items[0].id);
        assert.equal(await touchPage.locator('#lightbox-dialog').evaluate(dialog => dialog.open), false, 'Swipe in single-photo category opened lightbox');
      }
      await context.close();
      reports.push(width + 'px touch: left/right swipe, short gesture, single-photo category, vertical page scrolling and tap-to-lightbox in EN/DE/Thai');
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ reports, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
