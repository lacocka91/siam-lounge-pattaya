/* Navigation/layout regression checks against the running local preview.
   Requires Playwright and Chrome; SIAM_PLAYWRIGHT_MODULE may point outside this repo.
   Optional SIAM_QA_SCREENSHOTS writes screenshots into an existing directory. */
'use strict';
const { chromium } = require(process.env.SIAM_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const sections = ['home', 'central', 'pratumnak', 'stay', 'menu', 'gallery', 'events', 'contact'];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [], reports = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('http://127.0.0.1:4173/');
    const snapshot = async name => {
      if (process.env.SIAM_QA_SCREENSHOTS) await page.screenshot({ path: path.join(process.env.SIAM_QA_SCREENSHOTS, name + '.png') });
    };
    const resize = async (width, height) => {
      await page.setViewportSize({ width, height });
      await page.waitForFunction(() => document.querySelector('.menu-toggle').hidden === (innerWidth >= 1024));
    };
    const anchors = async mobile => {
      for (const id of sections) {
        if (mobile) await page.locator('.menu-toggle').click();
        await page.locator('#main-nav a[href="#' + id + '"]').click();
        await page.waitForFunction(id => location.hash === '#' + id, id);
        if (mobile) {
          assert.ok(await page.locator('#main-nav').isHidden());
          await page.waitForFunction(id => document.activeElement === document.querySelector('#' + id + ' h1, #' + id + ' h2'), id);
        }
        const position = await page.locator('#' + id).evaluate(el => ({ top: el.getBoundingClientRect().top, headerBottom: document.querySelector('.site-header').getBoundingClientRect().bottom }));
        assert.ok(position.top >= position.headerBottom - 1 && position.top < position.headerBottom + 80, id + ' anchor is obscured or off screen: ' + JSON.stringify(position));
      }
    };
    for (const lang of ['en', 'de', 'th']) {
      await page.locator('#language-toggle').click();
      await page.locator('.site-header [data-language="' + lang + '"]').click();
      assert.deepEqual(await page.locator('#main-nav a').evaluateAll(links => links.map(link => link.hash.slice(1))), sections);
      assert.ok(await page.locator('#main-nav a, .quick-actions button').evaluateAll(elements => elements.every(el => el.textContent === Siam.t(el.dataset.i18n))));
      for (const width of [1024, 1280, 1440, 1920, 2560]) {
        await resize(width, 900);
        await page.evaluate(() => scrollTo(0, 0));
        assert.ok(await page.locator('.quick-actions').isHidden());
        const layout = await page.evaluate(() => {
          const rect = el => el.getBoundingClientRect();
          const logo = rect(document.querySelector('.site-header .brand'));
          const left = rect(document.querySelector('.nav-group-left'));
          const right = rect(document.querySelector('.nav-group-right'));
          const links = [...document.querySelectorAll('#main-nav a')].map(rect);
          const language = rect(document.querySelector('.header-actions'));
          return {
            centered: Math.abs((logo.left + logo.right) / 2 - innerWidth / 2) < 1,
            balanced: Math.abs(left.width - right.width) < 1,
            separated: links.slice(0, 4).every(r => r.right <= logo.left - 12) && links.slice(4).every(r => r.left >= logo.right + 12 && r.right <= language.left - 8),
            readable: links.every((r, i) => r.width > 0 && r.height >= 44 && (!i || links[i - 1].right < r.left)),
            singleRow: links.every(r => Math.abs(r.top - links[0].top) < 1),
            noOverflow: document.documentElement.scrollWidth <= innerWidth,
            sticky: getComputedStyle(document.querySelector('.site-header')).position === 'sticky'
          };
        });
        assert.ok(Object.values(layout).every(Boolean), JSON.stringify({ lang, width, layout }));
        if ([1024, 1440].includes(width)) await snapshot('nav-' + lang + '-' + width);
        await anchors(false);
        assert.equal(await page.locator('.site-header').evaluate(el => el.getBoundingClientRect().top), 0);
      }
      for (const [width, height] of [[320, 568], [360, 640], [390, 844], [667, 375], [768, 900], [1023, 900]]) {
        await resize(width, height);
        await page.locator('.menu-toggle').click();
        await page.waitForFunction(() => document.activeElement.matches('#main-nav a[href="#home"]'));
        assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
        const layout = await page.evaluate(() => {
          const bar = document.querySelector('.quick-actions');
          const r = bar.getBoundingClientRect();
          const buttons = [...bar.querySelectorAll('button')].map(el => el.getBoundingClientRect());
          const nav = document.querySelector('#main-nav');
          const links = [...nav.querySelectorAll('a')].map(el => el.getBoundingClientRect());
          return {
            twoActions: buttons.length === 2 && Math.abs(buttons[0].width - buttons[1].width) < 1,
            touchTargets: buttons.every(b => b.height >= 60 && b.width >= 140),
            fixed: getComputedStyle(bar).position === 'fixed' && Math.abs(r.bottom - innerHeight) < 1,
            menuClear: nav.getBoundingClientRect().bottom <= r.top + 1,
            ordered: links.every((link, i) => !i || links[i - 1].bottom <= link.top),
            noOverflow: nav.scrollWidth <= nav.clientWidth && document.documentElement.scrollWidth <= innerWidth,
            reserved: parseFloat(getComputedStyle(document.body).paddingBottom) >= r.height
          };
        });
        assert.ok(Object.values(layout).every(Boolean), JSON.stringify({ lang, width, height, layout }));
        if (width === 320) await snapshot('nav-' + lang + '-mobile-menu');
        await page.keyboard.press('Escape');
        assert.ok(await page.locator('#main-nav').isHidden());
        assert.ok(await page.locator('.menu-toggle').evaluate(el => document.activeElement === el));
        await anchors(true);
        for (const kind of ['table', 'stay']) {
          const button = page.locator('.quick-actions [data-open-dialog="' + kind + '-dialog"]');
          await button.click();
          assert.ok(await page.locator('#' + kind + '-dialog').isVisible());
          await page.keyboard.press('Escape');
          await page.waitForFunction(kind => document.activeElement.matches('.quick-actions [data-open-dialog="' + kind + '-dialog"]'), kind);
        }
        await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
        assert.ok(await page.evaluate(() => document.querySelector('.footer-bottom').getBoundingClientRect().bottom <= document.querySelector('.quick-actions').getBoundingClientRect().top + 1));
        if (width === 320) {
          await page.evaluate(() => scrollTo(0, 0));
          await snapshot('nav-' + lang + '-mobile-actions');
        }
      }
      reports.push(lang + ': centered split desktop header at 5 widths, mobile menu and both actions at 6 sizes, all 8 anchors, sticky positioning and content clearance');
    }
    // Language changes inside an open menu preserve its state and translated links.
    await page.locator('.menu-toggle').click();
    await page.locator('#language-toggle').click();
    await page.locator('.site-header [data-language="de"]').click();
    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('#main-nav a[href="#stay"]').textContent(), 'Übernachten');
    await resize(1024, 900);
    assert.ok(await page.locator('#main-nav').isVisible());
    await page.locator('#main-nav a[href="#home"]').focus();
    await resize(320, 568);
    await page.waitForFunction(() => document.activeElement.matches('.menu-toggle'));
    assert.ok(await page.locator('#main-nav').isHidden());
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ reports, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
