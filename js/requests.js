(() => {
  'use strict';
  const app = window.Siam;
  const config = window.SIAM_CONFIG;
  const states = {};
  const fieldLabels = { consent: 'field.consent' };

  function updateDateLimits(state) {
    const today = app.today();
    if (state.kind === 'table') state.form.elements.date.min = today;
    else {
      state.form.elements.checkin.min = today;
      const arrival = state.form.elements.checkin.value;
      const earliestArrival = app.validDate(arrival) && arrival >= today ? arrival : today;
      const nextDay = new Date(earliestArrival + 'T12:00:00Z');
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      state.form.elements.checkout.min = nextDay.toISOString().slice(0, 10);
    }
  }
  function values(state) {
    const result = {};
    for (const [key, value] of new FormData(state.form)) result[key] = String(value).trim();
    result.location = state.kind === 'stay' ? 'pratumnak' : result.location;
    return result;
  }
  function validate(state) {
    updateDateLimits(state);
    const input = values(state), errors = [];
    const add = (name, key) => { if (!errors.some(error => error.name === name)) errors.push({ name, key }); };
    for (const element of state.form.querySelectorAll('[required]')) {
      if (element.type === 'checkbox' ? !element.checked : !element.value.trim()) add(element.name, element.type === 'checkbox' ? 'error.consent' : element.name === 'location' ? 'error.location' : 'error.required');
    }
    if (!Object.hasOwn(config.locations, input.location || '')) add('location', 'error.location');
    for (const name of state.kind === 'table' ? ['date'] : ['checkin', 'checkout']) {
      if (!app.validDate(input[name] || '')) add(name, 'error.date');
      else if (input[name] < app.today()) add(name, 'error.past');
    }
    if (state.kind === 'stay' && app.validDate(input.checkin) && app.validDate(input.checkout) && input.checkout <= input.checkin) add('checkout', 'error.checkout');
    if (state.kind === 'table' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time || '')) add('time', 'error.time');
    if (!/^\d{1,2}$/.test(input.guests || '') || Number(input.guests) < 1 || Number(input.guests) > 99) add('guests', 'error.guests');
    if (!input.name || input.name.length < 2 || input.name.length > 100) add('name', 'error.name');
    const contact = input.phone || '';
    const phoneNumber = /^[+\d\s().-]+$/.test(contact) && /^\d{6,20}$/.test(contact.replace(/\D/g, ''));
    const lineId = /^@?[a-z\d._-]{2,40}$/i.test(contact);
    if (contact.length > 40 || (!phoneNumber && !lineId)) add('phone', 'error.phone');
    if (input.email && (!app.email(input.email) || input.email.length > 254 || state.form.elements.email.validity.typeMismatch)) add('email', 'error.email');
    if ((input.requests || '').length > 1200) add('requests', 'error.requests');
    state.errors = errors;
    return errors;
  }
  function renderErrors(state) {
    state.form.querySelectorAll('.field-error').forEach(element => { element.hidden = true; element.textContent = ''; });
    state.form.querySelectorAll('[aria-invalid]').forEach(element => element.removeAttribute('aria-invalid'));
    const summary = state.form.querySelector('.form-errors');
    summary.replaceChildren(); summary.hidden = !state.errors.length;
    if (!state.errors.length) return;
    summary.append(app.node('p', '', app.t('error.heading')));
    const list = app.node('ul');
    state.errors.forEach(error => {
      const field = state.form.elements.namedItem(error.name);
      field.setAttribute('aria-invalid', 'true');
      const message = state.form.querySelector('#' + field.id + '-error');
      message.textContent = app.t(error.key); message.hidden = false;
      const link = app.node('a', '', app.t(fieldLabels[error.name] || 'field.' + error.name) + ': ' + app.t(error.key));
      link.href = '#' + field.id;
      link.addEventListener('click', event => { event.preventDefault(); field.focus(); });
      const item = app.node('li'); item.append(link); list.append(item);
    });
    summary.append(list);
  }
  function eventFor(state) { return app.confirmedEvents().find(event => event.id === state.eventId && event.date >= app.today()); }
  function renderOccasion(state) {
    const context = state.form.querySelector('.request-event');
    const event = eventFor(state);
    context.hidden = !event;
    context.textContent = event ? app.t('field.occasion') + ': ' + app.localize(event.title) : '';
  }
  function createSummary(state) {
    state.dialog.querySelector('.copy-status').textContent = '';
    state.dialog.querySelector('.copy-status').removeAttribute('data-i18n');
    const input = values(state);
    const title = app.t('request.' + state.kind + 'Title');
    const lines = [title, app.t('request.unconfirmed'), '', app.t('field.location') + ': ' + config.locations[input.location].name];
    const dateFields = state.kind === 'table' ? ['date', 'time'] : ['checkin', 'checkout'];
    for (const field of [...dateFields, 'guests', 'name', 'phone', 'email']) {
      if (!input[field]) continue;
      const value = ['date', 'checkin', 'checkout'].includes(field) ? app.formatDate(input[field]) + ' [' + input[field] + ']' : input[field];
      lines.push(app.t('field.' + field) + ': ' + value);
    }
    const event = eventFor(state);
    if (event) lines.push(app.t('field.occasion') + ': ' + app.localize(event.title));
    lines.push(app.t('field.requests') + ': ' + (input.requests || app.t('request.none')), '', app.t('request.timezone'));
    const text = lines.join('\n');
    state.result.querySelector('.request-summary').value = text;
    const contacts = config.locations[input.location];
    const whatsapp = state.result.querySelector('[data-send-whatsapp]');
    const email = state.result.querySelector('[data-send-email]');
    const number = app.whatsapp(contacts.whatsapp), address = app.email(contacts.email);
    whatsapp.hidden = !number; email.hidden = !address;
    whatsapp.removeAttribute('href'); email.removeAttribute('href');
    if (number) whatsapp.href = 'https://wa.me/' + number + '?text=' + encodeURIComponent(text);
    if (address) email.href = 'mailto:' + address + '?subject=' + encodeURIComponent(title + ' — ' + contacts.name) + '&body=' + encodeURIComponent(text);
    state.result.querySelector('[data-delivery-unavailable]').hidden = !!(number || address);
    state.result.querySelector('.request-facebook').dataset.contact = input.location + '.facebook';
    app.renderContacts();
  }
  function showForm(state) {
    state.form.hidden = false; state.result.hidden = true;
    state.prepareButton.hidden = false; state.copyButton.hidden = true;
    state.dialog.querySelector('.copy-status').textContent = '';
    state.dialog.querySelector('.copy-status').removeAttribute('data-i18n');
  }
  document.querySelectorAll('[data-request-form]').forEach(form => {
    const kind = form.dataset.requestForm;
    const dialog = form.closest('dialog');
    const state = states[kind] = { kind, form, dialog, result: document.getElementById(kind + '-result'), prepareButton: dialog.querySelector('[type="submit"]'), copyButton: dialog.querySelector('[data-copy-request]'), errors: [], eventId: null, attempted: false };
    updateDateLimits(state);
    form.addEventListener('submit', event => {
      event.preventDefault();
      state.attempted = true;
      validate(state); renderErrors(state);
      if (state.errors.length) { form.querySelector('.form-errors').focus(); return; }
      createSummary(state);
      form.hidden = true; state.result.hidden = false;
      state.prepareButton.hidden = true; state.copyButton.hidden = false;
      state.result.querySelector('h3').focus();
    });
    const updateForm = event => {
      if (['date', 'time', 'location'].includes(event.target.name) && state.eventId) {
        const selected = eventFor(state), input = values(state);
        if (!selected || selected.date !== input.date || (input.location && selected.location !== input.location) || (selected.time && selected.time !== input.time)) state.eventId = null;
        renderOccasion(state);
      }
      if (state.attempted) { validate(state); renderErrors(state); }
      else updateDateLimits(state);
    };
    form.addEventListener('input', updateForm);
    form.addEventListener('change', updateForm);
    form.addEventListener('focusin', () => updateDateLimits(state));
    form.addEventListener('reset', () => {
      state.eventId = null; state.errors = []; state.attempted = false;
      state.result.querySelector('.request-summary').value = '';
      state.result.querySelectorAll('[data-send-whatsapp], [data-send-email]').forEach(link => { link.removeAttribute('href'); link.hidden = true; });
      renderErrors(state); renderOccasion(state); showForm(state);
      requestAnimationFrame(() => updateDateLimits(state));
    });
    state.result.querySelector('[data-edit-request]').addEventListener('click', () => {
      showForm(state); form.querySelector('select, input').focus();
    });
    state.copyButton.addEventListener('click', async () => {
      const summary = state.result.querySelector('.request-summary');
      const status = state.dialog.querySelector('.copy-status');
      let copied = false;
      try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(summary.value); copied = true; } } catch { /* Fall back for file:// and restricted clipboard access. */ }
      if (!copied) {
        summary.focus(); summary.select(); summary.setSelectionRange(0, summary.value.length);
        try { copied = document.execCommand('copy'); } catch { /* Leave text selected for manual copying. */ }
      }
      status.dataset.i18n = copied ? 'request.copied' : 'request.copyFallback';
      status.textContent = app.t(status.dataset.i18n);
    });
  });
  app.refreshRequestDates = dialog => {
    const kind = dialog.querySelector('[data-request-form]')?.dataset.requestForm;
    if (states[kind]) updateDateLimits(states[kind]);
  };
  app.prepareTable = eventId => {
    const state = states.table;
    state.form.elements.location.value = '';
    state.eventId = eventId || null;
    const event = eventFor(state);
    if (event) {
      state.form.elements.date.value = event.date;
      state.form.elements.time.value = event.time || '';
    }
    state.errors = []; state.attempted = false;
    renderErrors(state); renderOccasion(state); updateDateLimits(state); showForm(state);
  };
  document.addEventListener('siam:language', () => {
    Object.values(states).forEach(state => {
      renderErrors(state); renderOccasion(state);
      if (!state.result.hidden) createSummary(state);
    });
  });
})();
