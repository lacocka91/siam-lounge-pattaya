/* Original-photo regression checks. Run against the local preview with Chrome.
   SIAM_PLAYWRIGHT_MODULE optionally points to an existing Playwright installation.
   SIAM_QA_SCREENSHOTS optionally names an existing output directory. */
'use strict';
const { chromium } = require(process.env.SIAM_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/images/manifest.json'), 'utf8'));
const base = 'http://127.0.0.1:4173/';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const failures = [], reports = [];
  try {
    assert.equal(manifest.images.length, 17);
    assert.equal(new Set(manifest.images.map(image => image.original)).size, 17);
    const approvedPaths = [manifest.hero.file, ...manifest.images.flatMap(image => image.variants.map(variant => variant.file))];
    for (const image of manifest.images) {
      for (const v of image.variants) {
        assert.equal(fs.statSync(path.join(root, v.file)).size, v.bytes);
        assert.ok(Math.abs(v.width / v.height - image.originalWidth / image.originalHeight) < 0.003, 'Aspect ratio changed: ' + v.file);
        assert.ok(v.width <= image.originalWidth && v.height <= image.originalHeight, 'Image enlarged: ' + v.file);
      }
    }
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => failures.push(e.message));
    page.on('console', m => { if (m.type() === 'error') failures.push(m.text()); });
    page.on('response', r => { if (r.status() >= 400) failures.push('HTTP ' + r.status() + ': ' + r.url()); });
    page.on('requestfailed', r => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') failures.push(r.url() + ': ' + r.failure()?.errorText); });
    page.on('request', r => { if (/^https?:/.test(r.url()) && !r.url().startsWith(base)) failures.push('External request: ' + r.url()); });
    const decode = async () => page.locator('main img').evaluateAll(images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); })));
    const screenshot = async (name, section) => {
      if (!process.env.SIAM_QA_SCREENSHOTS) return;
      const options = { path: path.join(process.env.SIAM_QA_SCREENSHOTS, name + '.png'), animations: 'disabled' };
      if (section) await page.locator('#' + section).screenshot({ ...options, style: '.site-header,.quick-actions,.skip-link { visibility: hidden !important; }' });
      else { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ ...options, fullPage: true }); }
    };
    await page.goto(base);
    const before = await page.locator('main img').evaluateAll(images => images.map(i => ({ width: i.getBoundingClientRect().width, height: i.getBoundingClientRect().height })));
    await decode();
    const after = await page.locator('main img').evaluateAll(images => images.map(i => ({ width: i.getBoundingClientRect().width, height: i.getBoundingClientRect().height })));
    assert.deepEqual(after, before, 'Image decoding changed layout dimensions');
    assert.equal(await page.locator('main img').count(), 27);
    assert.equal(await page.locator('.hero img').count(), 1);
    assert.equal(await page.locator('.original-logo').count(), 0);
    assert.ok(await page.evaluate(() => SIAM_DATA.events.length === 0 && SIAM_DATA.menu.length === 0));
    assert.equal(await page.locator('#explore .placeholder, #central .placeholder, #pratumnak .placeholder, #stay .placeholder, #gallery .placeholder').count(), 0);
    for (const lang of ['en', 'de', 'th']) {
      await page.locator('#language-toggle').click();
      await page.locator('#language-menu [data-language="' + lang + '"]').click();
      for (const width of [320, 390, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: width < 768 ? 740 : 1000 });
        await decode();
        const layout = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          images: [...document.querySelectorAll('main img')].map(image => ({
            src: image.currentSrc.split('/assets/')[1], width: image.naturalWidth,
            alt: image.alt, translated: !image.dataset.i18nAlt || image.alt === Siam.t(image.dataset.i18nAlt),
            dimensions: !!image.getAttribute('width') && !!image.getAttribute('height'),
            fit: getComputedStyle(image).objectFit,
            withinPage: !!image.closest('.gallery-thumbnails') || (image.getBoundingClientRect().left >= -1 && image.getBoundingClientRect().right <= innerWidth + 1)
          })),
          galleryAlt: [...document.querySelectorAll('.gallery-open')].every(button => button.querySelector('img').alt === Siam.localize(SIAM_DATA.gallery.find(item => item.id === button.dataset.galleryId).alt))
        }));
        assert.ok(!layout.overflow && layout.galleryAlt, lang + ' overflow or alt error at ' + width);
        for (const i of layout.images) assert.ok(i.width > 0 && i.alt && i.translated && i.dimensions && i.fit === 'contain' && i.withinPage && approvedPaths.includes('assets/' + i.src), JSON.stringify({ lang, width, image: i }));
        if ((lang === 'en' && [768, 1440].includes(width)) || (lang === 'de' && width === 320) || (lang === 'th' && width === 390)) {
          await screenshot('photos-' + lang + '-' + width);
          for (const id of ['explore', 'central', 'pratumnak', 'stay', 'gallery']) await screenshot('photos-' + lang + '-' + width + '-' + id, id);
        }
      }
      for (const category of ['food', 'central', 'pratumnak', 'stay', 'events']) {
        await page.locator('[data-gallery-filter="' + category + '"]').click();
        assert.equal(await page.locator('.gallery-thumbnail').count(), manifest.images.filter(image => image.category === category).length);
      }
      await page.locator('[data-gallery-filter="all"]').click();
      await page.setViewportSize({ width: lang === 'de' ? 768 : lang === 'th' ? 1440 : 320, height: 850 });
      for (const image of manifest.images) {
        await page.locator('[data-gallery-thumb="' + image.id + '"]').click();
        await page.locator('.gallery-main-open').click();
        const enlarged = page.locator('.lightbox-image');
        await enlarged.evaluate(img => img.decode());
        assert.equal(await enlarged.getAttribute('alt'), image.alt[lang]);
        assert.equal(await enlarged.getAttribute('src'), image.variants[2].file);
        assert.equal(await enlarged.evaluate(img => getComputedStyle(img).objectFit), 'contain');
        assert.ok(await page.locator('#lightbox-dialog').evaluate(el => el.getBoundingClientRect().right <= innerWidth && el.getBoundingClientRect().bottom <= innerHeight));
        if (image.id === 'stay-bathroom') await screenshot('photos-lightbox-' + lang, 'lightbox-dialog');
        await page.keyboard.press('Escape');
        await page.waitForFunction(id => document.activeElement.dataset.galleryId === id, image.id);
      }
      reports.push(lang + ': 27 placements at 6 widths, 17 lightboxes, all gallery categories, translated alt text and no cropped frames');
    }
    for (const url of [base + 'siam-lounge-pattaya/', pathToFileURL(path.join(root, 'index.html')).href]) {
      await page.goto(url); await decode();
      assert.equal(await page.locator('.gallery-thumbnail').count(), 17);
      assert.equal(await page.locator('.gallery-main-open').count(), 1);
      assert.ok(await page.locator('main img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
    }
    const noJSContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 740 } });
    const noJS = await noJSContext.newPage(); await noJS.goto(base);
    assert.equal(await noJS.locator('#gallery-grid img').count(), 17);
    await noJS.locator('main img').evaluateAll(images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); })));
    assert.ok(await noJS.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await noJSContext.close();
    reports.push('All 51 variants exist; image dimensions stable; GitHub Pages subpath, file:// and no-JS photos work');
    assert.deepEqual(failures, []);
    console.log(JSON.stringify({ reports, failures }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
