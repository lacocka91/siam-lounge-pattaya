/* Optional browser regression checks; no production dependency.
   Requires Playwright and Chrome. The fixtures exist only in the isolated test page.
   Run with the preview running: node tests/browser.cjs
   SIAM_PLAYWRIGHT_MODULE may point at an existing external Playwright installation. */
'use strict';
const { chromium } = require(process.env.SIAM_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const url = 'http://127.0.0.1:4173/';
const failures = [], reports = [];
function check(condition, message) { if (!condition) failures.push(message); }

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on('pageerror', error => failures.push('JS: ' + error.message));
    page.on('console', message => { if (message.type() === 'error') failures.push('Console: ' + message.text()); });
    page.on('requestfailed', request => failures.push('Request failed: ' + request.url()));
    page.on('response', response => { if (response.status() >= 400) failures.push('HTTP ' + response.status() + ': ' + response.url()); });
    page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(url)) failures.push('Unexpected external request: ' + request.url()); });
    const setLanguage = async (lang, dialog = '') => {
      if (!dialog) await page.locator('#language-toggle').click();
      await page.locator((dialog || '.site-header') + ' [data-language="' + lang + '"]').click();
    };
    const openTable = async () => page.locator('.hero [data-open-dialog="table-dialog"]').click();
    const submit = async kind => page.locator('[type="submit"][form="' + kind + '-form"]').click();
    const dates = async () => page.evaluate(() => {
      const today = Siam.today(), d = new Date(today + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() + 7); const next = d.toISOString().slice(0, 10);
      d.setUTCDate(d.getUTCDate() + 3); return { today, next, after: d.toISOString().slice(0, 10) };
    });
    const fill = async (kind, when) => {
      if (kind === 'table') await page.locator('#table-location').selectOption('central');
      for (const [name, value] of Object.entries({ ...(kind === 'table' ? { date: when.next, time: '18:30' } : { checkin: when.next, checkout: when.after }), guests: '2', name: 'QA Visitor', phone: '+000 123456789', ...(kind === 'stay' ? { email: 'visitor@example.invalid' } : {}) })) await page.locator('#' + kind + '-' + name).fill(value);
      await page.locator('#' + kind + '-consent').check();
    };
    await page.goto(url);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('#events-grid .event-card').count(), 0);
    assert.equal(await page.locator('#event-archive').isHidden(), true);
    assert.equal(await page.locator('#menu-dishes').isHidden(), true);
    assert.equal(await page.locator('#gallery-grid figure').count(), 17);
    assert.equal(await page.locator('.quick-actions button').count(), 2);
    const structure = await page.evaluate(() => ({
      missingLabels: [...document.querySelectorAll('input, select, textarea')].filter(el => !el.labels.length).map(el => el.id),
      brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(el => !document.getElementById(el.hash.slice(1))).map(el => el.hash),
      external: [...new Set([...document.querySelectorAll('a[href^="https:"]')].map(el => el.href))],
      unknownBusinessDetails: Object.values(SIAM_CONFIG.locations).some(location => location.phone || location.whatsapp || location.email || location.maps),
      noFakeData: SIAM_DATA.events.length === 0 && SIAM_DATA.menu.length === 0
    }));
    check(!structure.missingLabels.length, 'Unlabelled fields: ' + structure.missingLabels);
    check(!structure.brokenAnchors.length, 'Broken anchors: ' + structure.brokenAnchors);
    check(structure.external.length === 3 && !structure.unknownBusinessDetails && structure.noFakeData, 'Unexpected public data or external URLs');
    reports.push('Static links, empty states, original Facebook/Booking.com URLs and form labels');

    for (const lang of ['en', 'de', 'th']) {
      await setLanguage(lang);
      const mismatches = await page.evaluate(() => [...document.querySelectorAll('[data-i18n], [data-i18n-aria]')].filter(el =>
        (el.dataset.i18n && el.textContent !== Siam.t(el.dataset.i18n)) ||
        (el.dataset.i18nAria && el.getAttribute('aria-label') !== Siam.t(el.dataset.i18nAria))
      ).map(el => el.outerHTML.slice(0, 100)));
      check(!mismatches.length, lang + ' translation mismatches: ' + mismatches.join(', '));
      for (const width of [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: 850 });
        await page.waitForFunction(() => document.querySelector('.menu-toggle').hidden === (innerWidth >= 1024));
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), lang + ' page overflow at ' + width);
        for (const id of ['table-dialog', 'stay-dialog', 'locations-dialog']) {
          await page.evaluate(id => Siam.openDialog(id), id);
          check(await page.locator('#' + id).evaluate(el => el.scrollWidth <= el.clientWidth && el.querySelector('.dialog-body').scrollWidth <= el.querySelector('.dialog-body').clientWidth && el.getBoundingClientRect().right <= innerWidth + 1), lang + ' ' + id + ' overflow at ' + width);
          await page.keyboard.press('Escape');
          await page.waitForFunction(() => !document.querySelector('dialog[open]'));
        }
      }
      reports.push(lang + ': all text / aria translations, 9 page widths and 27 modal layouts');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await setLanguage('en');
    const toggle = page.locator('.menu-toggle');
    await toggle.click(); await page.keyboard.press('Escape');
    check(await toggle.evaluate(el => el === document.activeElement), 'Menu Escape focus');
    await toggle.click(); await page.locator('#main-nav a[href="#events"]').click();
    await page.waitForFunction(() => document.activeElement.id === 'events-title');
    check(await page.locator('#main-nav').isHidden(), 'Mobile navigation did not close');
    await page.locator('#central [data-open-dialog="locations-dialog"]').click();
    await page.locator('#locations-dialog [data-location="pratumnak"]').click();
    await page.waitForFunction(() => document.querySelector('#table-dialog').open);
    assert.equal(await page.locator('#table-location').inputValue(), '');
    check(await page.evaluate(() => document.body.classList.contains('modal-open')), 'Scroll lock lost when switching modals');
    await page.keyboard.press('Escape');
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    check(await page.evaluate(() => document.querySelector('.footer-bottom').getBoundingClientRect().bottom <= document.querySelector('.quick-actions').getBoundingClientRect().top + 1), 'Quick bar covers footer at end of page');
    reports.push('Mobile navigation, quick actions, explicit location selection and content clearance');

    await openTable();
    await page.keyboard.press('Shift+Tab');
    check(await page.evaluate(() => document.activeElement.closest('#table-dialog') !== null), 'Modal reverse Tab escaped');
    await page.keyboard.press('Tab');
    check(await page.evaluate(() => document.activeElement.closest('#table-dialog') !== null), 'Modal Tab escaped');
    await submit('table');
    assert.ok(await page.locator('#table-form [aria-invalid="true"]').count() >= 6);
    for (const lang of ['de', 'th', 'en']) {
      await setLanguage(lang, '#table-dialog');
      check(await page.locator('#table-date-error').textContent() === await page.evaluate(() => Siam.t('error.required')), 'Error translation ' + lang);
    }
    const when = await dates();
    await fill('table', when);
    await page.locator('#table-date').fill('2000-01-01');
    await page.locator('#table-guests').fill('1.5');
    await page.locator('#table-phone').fill('<>');
    await page.locator('#table-email').fill('invalid');
    await submit('table');
    for (const id of ['date', 'guests', 'phone', 'email']) assert.equal(await page.locator('#table-' + id).getAttribute('aria-invalid'), 'true');
    await fill('table', when); await page.locator('#table-email').fill('');
    await page.locator('#table-requests').fill('QA only: <script>not executable</script>');
    await submit('table');
    assert.equal(await page.locator('#table-result').isVisible(), true);
    assert.match(await page.locator('#table-summary').inputValue(), /Request a table reservation[\s\S]*not confirmed/);
    assert.equal(await page.locator('#table-result [data-delivery-unavailable]').isDisabled(), true);
    assert.equal(await page.locator('#table-result [data-send-whatsapp]').getAttribute('href'), null);
    assert.equal(await page.locator('#table-result [data-send-email]').getAttribute('href'), null);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.qaCopied = value; } } }));
    await page.locator('[data-copy-request="table"]').click();
    assert.equal(await page.evaluate(() => window.qaCopied), await page.locator('#table-summary').inputValue());
    await setLanguage('de', '#table-dialog');
    assert.match(await page.locator('#table-summary').inputValue(), /^Tischreservierung anfragen/);
    check(!(await page.locator('#table-summary').inputValue()).includes('Location:'), 'Summary language mixture');
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }); document.execCommand = () => false; });
    await page.locator('[data-copy-request="table"]').click();
    assert.equal(await page.locator('#table-dialog .copy-status').textContent(), await page.evaluate(() => Siam.t('request.copyFallback')));
    await page.keyboard.press('Escape');
    reports.push('Table: required fields, past dates, fractional guests, phone/email validation, summary, translated errors, copy and manual fallback');

    await page.locator('.quick-actions [data-open-dialog="stay-dialog"]').click();
    await fill('stay', when);
    await page.locator('#stay-checkout').fill(when.next); await page.locator('#stay-email').fill('');
    await submit('stay');
    assert.equal(await page.locator('#stay-checkout').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.locator('#stay-email').getAttribute('aria-invalid'), 'true');
    await page.locator('#stay-checkout').fill(when.after); await page.locator('#stay-email').fill('visitor@example.invalid');
    await submit('stay');
    assert.match(await page.locator('#stay-summary').inputValue(), /Unterkunftsanfrage[\s\S]*Siam Lounge Pratumnak/);
    // Transport fixtures are never persisted and no request is actually sent.
    await page.evaluate(() => { SIAM_CONFIG.locations.pratumnak.whatsapp = '000123456789'; SIAM_CONFIG.locations.pratumnak.email = 'qa@example.invalid'; document.dispatchEvent(new CustomEvent('siam:language')); });
    const wa = await page.locator('#stay-result [data-send-whatsapp]').getAttribute('href');
    const mail = await page.locator('#stay-result [data-send-email]').getAttribute('href');
    assert.equal(new URL(wa).searchParams.get('text'), await page.locator('#stay-summary').inputValue());
    assert.ok(mail.startsWith('mailto:qa@example.invalid?subject='));
    assert.equal(new URL(mail).searchParams.get('body'), await page.locator('#stay-summary').inputValue());
    await page.keyboard.press('Escape');
    reports.push('Stay: checkout ordering, mandatory email, correct location and config-driven WhatsApp/email drafts');

    await page.reload(); await setLanguage('en');
    await page.evaluate(({ next }) => {
      const words = { en: 'QA fixture', de: 'QA-Testeintrag', th: 'ข้อมูลทดสอบ' };
      SIAM_DATA.events.push({ id: 'qa-upcoming', title: words, description: words, date: next, time: '19:00', location: 'central', category: 'pool', image: '', reservationEnabled: true });
      SIAM_DATA.events.push({ id: 'qa-past', title: words, description: words, date: '2000-01-01', time: '', location: 'pratumnak', category: 'special', image: '', reservationEnabled: true });
      SIAM_DATA.menu.push({ id: 'qa-dish', name: words, description: words, category: 'thai', price: null, currency: '', popular: true, spicy: true, vegetarian: true, image: '' });
      SIAM_DATA.gallery[0] = { id: 'qa-image', category: 'food', image: 'assets/images/qa-placeholder.svg', width: 900, height: 650, alt: words };
    }, when);
    await page.route('**/assets/images/qa-placeholder.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="650"><rect width="900" height="650" fill="#eee"/></svg>' }));
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('siam:language')));
    assert.equal(await page.locator('#events-grid .event-card').count(), 1);
    assert.equal(await page.locator('#past-events-grid .event-card').count(), 1);
    assert.equal(await page.locator('#past-events-grid [data-open-dialog="table-dialog"]').count(), 0);
    await page.locator('[data-event-id="qa-upcoming"]').click();
    assert.equal(await page.locator('#table-date').inputValue(), when.next);
    assert.equal(await page.locator('#table-time').inputValue(), '19:00');
    assert.equal(await page.locator('#table-location').inputValue(), '');
    await page.locator('#table-location').selectOption('central');
    await setLanguage('de', '#table-dialog');
    assert.match(await page.locator('#table-form .request-event').textContent(), /Veranstaltung: QA-Testeintrag/);
    await page.keyboard.press('Escape');
    await page.locator('[data-menu-category="thai"]').click();
    assert.equal(await page.locator('#menu-dishes .dish-card').count(), 1);
    assert.equal(await page.locator('.dish-badges span').count(), 3);
    assert.equal(await page.locator('.dish-price').textContent(), 'Preis wird noch bestätigt');
    await page.locator('[data-gallery-filter="food"]').click();
    assert.equal(await page.locator('#gallery-grid figure').count(), 1);
    await page.locator('.gallery-open').click();
    assert.equal(await page.locator('#lightbox-dialog').isVisible(), true);
    await setLanguage('th', '#lightbox-dialog');
    assert.equal(await page.locator('.lightbox-image').getAttribute('alt'), 'ข้อมูลทดสอบ');
    await page.keyboard.press('Escape');
    // Native dialog close/focus events are queued; wait for the observable result.
    await page.waitForFunction(() => document.activeElement.matches('.gallery-open'));
    reports.push('In-memory fixtures: upcoming/past events, event prefill, translated menu badges, gallery filters, lightbox and return focus');

    await page.goto(url + 'siam-lounge-pattaya/');
    await setLanguage('de'); await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'), 'de');
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await openTable(); assert.equal(await page.locator('#table-dialog').isVisible(), true); await page.keyboard.press('Escape');
    const fallback = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 850 } });
    const noJS = await fallback.newPage(); await noJS.goto(url);
    check(await noJS.locator('#main-nav').isVisible(), 'No-JS navigation');
    check(await noJS.locator('.quick-actions').isHidden(), 'No-JS inactive quick actions');
    check(await noJS.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No-JS 320px overflow');
    await fallback.close();
    reports.push('Language persistence, file://, GitHub Pages subpath, reduced motion and no-JS fallback');
    await context.close();
  } catch (error) { failures.push(error.stack); }
  finally { await browser.close(); }
  console.log(JSON.stringify({ reports, failures }, null, 2));
  process.exitCode = failures.length ? 1 : 0;
})();
