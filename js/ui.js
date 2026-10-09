(() => {
  'use strict';
  const app = window.Siam = {
    get language() { return document.documentElement.lang || 'en'; },
    t(key) { return window.SIAM_TRANSLATIONS[this.language]?.[key] || key; },
    localize(value) { return typeof value === 'string' ? value : value?.[this.language] || ''; },
    translate(root = document) {
      for (const [attribute, target] of [['data-i18n', 'textContent'], ['data-i18n-aria', 'aria-label'], ['data-i18n-alt', 'alt']]) {
        root.querySelectorAll('[' + attribute + ']').forEach(element => {
          const text = this.t(element.getAttribute(attribute));
          if (target === 'textContent') element.textContent = text;
          else element.setAttribute(target, text);
        });
      }
    },
    today() {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      const get = type => parts.find(part => part.type === type).value;
      return `${get('year')}-${get('month')}-${get('day')}`;
    },
    validDate(value) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(value + 'T12:00:00Z');
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    },
    formatDate(value) {
      return this.validDate(value) ? new Intl.DateTimeFormat({ en: 'en-GB', de: 'de-DE', th: 'th-TH' }[this.language], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z')) : value;
    },
    safeHttps(value) {
      try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
    },
    localImage(value) { return typeof value === 'string' && /^assets\/images\/[a-zA-Z0-9_./-]+\.(avif|webp|png|jpe?g|svg)$/i.test(value) && !value.includes('..') ? value : ''; },
    phone(value) { return /^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 6 ? value.replace(/[^+\d]/g, '') : ''; },
    whatsapp(value) { return /^\d{7,15}$/.test(value) ? value : ''; },
    email(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[?&#\r\n]/.test(value) ? value : ''; },
    node(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }
  };
  let returnFocus = null;
  let returnDescriptor = null;
  let activeDialog = null;

  app.openDialog = (id, trigger = document.activeElement) => {
    const dialog = document.getElementById(id);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    if (activeDialog === dialog && dialog.open) return;
    const originalTrigger = activeDialog ? returnFocus : trigger;
    if (activeDialog) activeDialog.close();
    returnFocus = originalTrigger;
    if (!activeDialog) returnDescriptor = originalTrigger?.dataset.galleryId ? ['galleryId', originalTrigger.dataset.galleryId] : originalTrigger?.dataset.eventId ? ['eventId', originalTrigger.dataset.eventId] : null;
    activeDialog = dialog;
    document.body.classList.add('modal-open');
    app.refreshRequestDates?.(dialog);
    dialog.showModal();
    dialog.querySelector('.dialog-body').scrollTop = 0;
    dialog.querySelector('[data-dialog-heading]')?.focus({ preventScroll: true });
  };
  app.closeDialog = () => activeDialog?.close();

  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      // Switching dialogs must not restore focus behind the next modal.
      if (activeDialog !== dialog || dialog.open) return;
      activeDialog = null;
      document.body.classList.remove('modal-open');
      let target = returnFocus?.isConnected ? returnFocus : null;
      if (!target && returnDescriptor) target = [...document.querySelectorAll('[data-gallery-id], [data-event-id]')].find(element => element.dataset[returnDescriptor[0]] === returnDescriptor[1]);
      if (!target?.getClientRects().length) target = [...document.querySelectorAll('.menu-toggle, .nav-reserve, .brand')].find(element => element.getClientRects().length);
      target?.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      if (event.target.closest('[data-close-dialog]')) dialog.close();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), select, textarea, [tabindex="0"]')].filter(el => el.getClientRects().length && !el.closest('[hidden]'));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
    });
  });
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-open-dialog]');
    if (!trigger) return;
    event.preventDefault();
    const id = trigger.dataset.openDialog;
    if (id === 'table-dialog') app.prepareTable?.(trigger.dataset.eventId);
    app.openDialog(id, trigger);
  });
  document.addEventListener('siam:language', () => app.translate());
})();
