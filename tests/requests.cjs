/* Focused request-dialog checks. Requires the preview server, Playwright and Chrome.
   SIAM_PLAYWRIGHT_MODULE can point to an external installation.
   Optional SIAM_QA_SCREENSHOTS points to an existing screenshot directory. */
'use strict';
const { chromium } = require(process.env.SIAM_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const reports = [];
  try {
    const context = await browser.newContext({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce', isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const translated = key => page.evaluate(key => Siam.t(key), key);
    const clickSubmit = kind => page.locator('button[type="submit"][form="' + kind + '-form"]').click();
    const field = (kind, name) => page.locator('#' + kind + '-' + name);
    const close = async () => {
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    };
    const checkLayout = async (kind, stage) => {
      for (const [width, height] of [[320, 568], [360, 640], [390, 844], [667, 375], [1440, 900]]) {
        await page.setViewportSize({ width, height });
        for (const end of [false, true]) {
          const layout = await page.locator('#' + kind + '-dialog').evaluate((dialog, end) => {
            const body = dialog.querySelector('.dialog-body');
            body.scrollTop = end ? body.scrollHeight : 0;
            const footer = dialog.querySelector('.request-dialog-footer');
            const primary = footer.querySelector('button:not([hidden])');
            const b = body.getBoundingClientRect(), f = footer.getBoundingClientRect(), p = primary.getBoundingClientRect();
            const toolbar = dialog.querySelector('.dialog-toolbar').getBoundingClientRect();
            const lastControl = [...body.querySelectorAll('input, select, textarea, button, a[href]')].filter(el => el.getClientRects().length && !el.closest('[hidden]')).at(-1).getBoundingClientRect();
            return {
              noOverflow: body.scrollWidth <= body.clientWidth && dialog.scrollWidth <= dialog.clientWidth && document.documentElement.scrollWidth <= innerWidth,
              visible: p.top >= 0 && p.bottom <= innerHeight && p.left >= 0 && p.right <= innerWidth && p.height >= 44,
              uncovered: b.bottom <= f.top + 1 && b.top >= toolbar.bottom - 1 && b.height > 100,
              lastReachable: !end || lastControl.bottom <= f.top + 1,
              primary: primary.textContent.trim()
            };
          }, end);
          assert.ok(layout.noOverflow && layout.visible && layout.uncovered && layout.lastReachable, JSON.stringify({ kind, stage, width, height, end, layout }));
        }
      }
      await page.setViewportSize({ width: 320, height: 568 });
      await page.locator('#' + kind + '-dialog .dialog-body').evaluate(el => { el.scrollTop = 0; });
      if (process.env.SIAM_QA_SCREENSHOTS) {
        const lang = await page.locator('html').getAttribute('lang');
        await page.screenshot({ path: path.join(process.env.SIAM_QA_SCREENSHOTS, lang + '-' + kind + '-' + stage + '.png') });
      }
    };
    const checkFocus = async kind => {
      const first = page.locator('#' + kind + '-dialog [data-language="en"]');
      const primary = page.locator('#' + kind + '-dialog .request-dialog-footer button:not([hidden])');
      await first.focus(); await page.keyboard.press('Shift+Tab');
      assert.ok(await primary.evaluate(el => el === document.activeElement), 'Reverse focus trap');
      await page.keyboard.press('Tab');
      assert.ok(await first.evaluate(el => el === document.activeElement), 'Forward focus trap');
    };
    for (const lang of ['en', 'de', 'th']) {
      for (const kind of ['table', 'stay']) {
        await page.goto('http://127.0.0.1:4173/');
        await page.locator('#language-toggle').click();
        await page.locator('.site-header [data-language="' + lang + '"]').click();
        const trigger = page.locator('.quick-actions [data-open-dialog="' + kind + '-dialog"]');
        await trigger.click();
        const when = await page.evaluate(() => {
          const today = Siam.today();
          const add = days => { const d = new Date(today + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
          return { today, past: add(-1), tomorrow: add(1), arrival: add(7), departure: add(8) };
        });
        assert.equal(await page.locator('label[for="' + kind + '-phone"] [data-i18n]').textContent(), await translated('field.phone'));
        assert.match(await translated('field.phone'), /WhatsApp \/ LINE/);
        assert.equal(await field(kind, kind === 'table' ? 'date' : 'checkin').getAttribute('min'), when.today);
        if (kind === 'table') {
          assert.equal(await field(kind, 'location').inputValue(), '');
          assert.equal(await page.locator('#table-location option:checked').textContent(), { en: 'Choose a location', de: 'Standort wählen', th: 'เลือกสาขา' }[lang]);
          assert.equal(await field(kind, 'time').getAttribute('min'), null);
          assert.equal(await field(kind, 'time').getAttribute('max'), null);
        } else assert.equal(await field(kind, 'checkout').getAttribute('min'), when.tomorrow);
        await checkLayout(kind, 'form'); await checkFocus(kind);
        for (const [name, value] of Object.entries({ name: 'QA Visitor', phone: kind === 'table' ? 'qa.visitor_01' : '@qa-visitor', guests: '2', ...(kind === 'stay' ? { email: 'visitor@example.invalid' } : {}) })) await field(kind, name).fill(value);
        await field(kind, 'consent').check();
        const dateField = kind === 'table' ? 'date' : 'checkin';
        await field(kind, dateField).fill(when.past);
        if (kind === 'table') await field(kind, 'time').fill('00:00');
        else await field(kind, 'checkout').fill(when.departure);
        await clickSubmit(kind);
        assert.equal(await field(kind, dateField + '-error').textContent(), await translated('error.past'));
        assert.ok(await page.locator('#' + kind + '-form').isVisible());
        if (kind === 'table') {
          assert.equal(await field(kind, 'location-error').textContent(), await translated('error.location'));
          await field(kind, 'location').selectOption('pratumnak');
        }
        await field(kind, dateField).fill(when.arrival);
        if (kind === 'stay') {
          assert.equal(await field(kind, 'checkout').getAttribute('min'), when.departure);
          for (const checkout of [when.today, when.arrival]) {
            await field(kind, 'checkout').fill(checkout); await clickSubmit(kind);
            assert.equal(await field(kind, 'checkout-error').textContent(), await translated('error.checkout'));
            assert.ok(await page.locator('#stay-form').isVisible());
          }
          // Exercise change-only datepicker events and calendar boundaries.
          for (const [arrival, minimum] of [['2099-12-31', '2100-01-01'], ['2104-02-28', '2104-02-29']]) {
            await field(kind, 'checkin').evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); }, arrival);
            assert.equal(await field(kind, 'checkout').getAttribute('min'), minimum);
          }
          await field(kind, 'checkin').fill(when.arrival);
          await field(kind, 'checkout').fill(when.departure);
        }
        // Enter still submits through the footer's form-associated button.
        await field(kind, 'name').focus(); await page.keyboard.press('Enter');
        assert.ok(await page.locator('#' + kind + '-result').isVisible());
        const summary = await field(kind, 'summary').inputValue();
        assert.ok(summary.includes(await translated('request.unconfirmed')));
        assert.ok(summary.includes(await translated('field.phone')));
        assert.ok(summary.includes(kind === 'table' ? 'qa.visitor_01' : '@qa-visitor'));
        assert.ok(await page.locator('#' + kind + '-result [data-send-whatsapp]').isHidden());
        await checkLayout(kind, 'summary'); await checkFocus(kind);
        await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.qaCopied = value; } } }));
        await page.locator('[data-copy-request="' + kind + '"]').click();
        assert.equal(await page.evaluate(() => window.qaCopied), summary);
        assert.equal(await page.locator('#' + kind + '-dialog .copy-status').textContent(), await translated('request.copied'));
        await page.locator('[data-edit-request="' + kind + '"]').click();
        assert.equal(await field(kind, 'phone').inputValue(), kind === 'table' ? 'qa.visitor_01' : '@qa-visitor');
        if (kind === 'table') {
          assert.equal(await field(kind, 'location').inputValue(), 'pratumnak');
          await field(kind, 'time').fill('23:59');
          await clickSubmit(kind);
          assert.ok((await field(kind, 'summary').inputValue()).includes('23:59'));
          await page.locator('[data-edit-request="table"]').click();
        }
        await page.locator('#' + kind + '-form [type="reset"]').click();
        assert.equal(await field(kind, 'phone').inputValue(), '');
        if (kind === 'table') assert.equal(await field(kind, 'location').inputValue(), '');
        else await page.waitForFunction(minimum => document.getElementById('stay-checkout').min === minimum, when.tomorrow);
        await close();
        await page.waitForFunction(kind => document.activeElement.matches('.quick-actions [data-open-dialog="' + kind + '-dialog"]'), kind);
        // Simulate an already-open page crossing midnight in Pattaya.
        await page.evaluate(today => { Siam.today = () => today; }, when.tomorrow);
        await trigger.click();
        assert.equal(await field(kind, dateField).getAttribute('min'), when.tomorrow);
        if (kind === 'table') assert.equal(await field(kind, 'location').inputValue(), '');
        await close();
        reports.push(lang + ' ' + kind + ': dates, LINE, copy, reset, keyboard, midnight refresh; 5 viewport sizes in form and summary');
      }
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ reports, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
