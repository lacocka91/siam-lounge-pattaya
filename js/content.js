(() => {
  'use strict';
  const app = window.Siam;
  const config = window.SIAM_CONFIG;
  const data = window.SIAM_DATA;
  let menuCategory = 'breakfast';
  let galleryCategory = 'all';
  let galleryItems = [];
  let galleryId = null;
  let galleryView = null;
  let lightboxItem = null;
  const galleryKeys = { food: 'gallery.food', central: 'nav.central', pratumnak: 'nav.pratumnak', stay: 'nav.stay', events: 'gallery.events' };
  const art = { food: 'art-orbit food-art', central: 'art-arch central-art', pratumnak: 'art-orbit pratumnak-art', stay: 'art-steps stay-art', events: 'art-arch event-art' };
  const translated = value => value && ['en', 'de', 'th'].every(lang => typeof value[lang] === 'string' && value[lang].trim());

  function externalLink(href, label) {
    const link = app.node('a', '', label);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.append(app.node('span', 'sr-only', app.t('external')));
    return link;
  }

  function contactLink(location, field) {
    const value = config.locations[location]?.[field] || '';
    let href = '', label = value;
    if (field === 'phone' && app.phone(value)) href = 'tel:' + app.phone(value);
    if (field === 'email' && app.email(value)) href = 'mailto:' + value;
    if (field === 'whatsapp' && app.whatsapp(value)) { href = 'https://wa.me/' + value; label = 'WhatsApp ↗'; }
    if (['maps', 'facebook', 'line'].includes(field) && app.safeHttps(value)) {
      href = app.safeHttps(value);
      label = field === 'maps' ? app.t('cta.directions') : field === 'facebook' ? app.t('contact.facebook') : 'LINE';
    }
    if (href) {
      if (href.startsWith('https:')) return externalLink(href, label);
      const link = app.node('a', '', label); link.href = href; return link;
    }
    return app.node('span', 'contact-pending', ['address', 'hours'].includes(field) && translated(value) ? app.localize(value) : app.t('common.soon'));
  }
  app.renderContacts = () => {
    document.querySelectorAll('[data-contact]').forEach(element => {
      const [location, field] = element.dataset.contact.split('.');
      element.replaceChildren(contactLink(location, field));
    });
    document.querySelectorAll('[data-config-link]').forEach(link => {
      const [location, field] = link.dataset.configLink.split('.');
      const href = app.safeHttps(location === 'stay' ? config.stay[field] : config.locations[location]?.[field]);
      if (href) { link.href = href; link.removeAttribute('aria-disabled'); }
      else { link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true'); }
    });
    const agoda = document.querySelector('[data-stay-agoda]');
    const agodaURL = app.safeHttps(config.stay.agoda);
    if (agodaURL) { const link = externalLink(agodaURL, 'Agoda ↗'); link.className = 'button button-line'; agoda.replaceChildren(link); }
    else agoda.replaceChildren(app.node('span', 'button button-unavailable', app.t('agoda.pending')));
  };
  // Also centralize the existing no-JavaScript Facebook / Booking.com fallback links.
  const official = { 'https://www.facebook.com/siamloungepattaya': 'central.facebook', 'https://www.facebook.com/SiamLoungePratumnak': 'pratumnak.facebook', 'https://www.booking.com/hotel/th/siam-lounge-pratumnak.de.html': 'stay.booking' };
  document.querySelectorAll('a[href]').forEach(link => {
    if (official[link.getAttribute('href')]) link.dataset.configLink = official[link.getAttribute('href')];
  });

  function placeholder(category, label) {
    const box = app.node('div', 'placeholder ' + (art[category] || art.events));
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', label + ' · ' + app.t('photo.placeholder'));
    box.append(app.node('span', 'placeholder-label', app.t('photo.placeholder')));
    return box;
  }
  function picture(item, category, label, enlarge = false) {
    const src = app.localImage(item.image);
    if (!src || !translated(item.alt)) return placeholder(category, label);
    const image = app.node('img', 'content-photo');
    image.src = app.localImage(item.thumbnail) || src;
    image.alt = app.localize(item.alt);
    image.width = Number.isInteger(item.width) && item.width > 0 ? item.width : 900;
    image.height = Number.isInteger(item.height) && item.height > 0 ? item.height : 650;
    if (Array.isArray(item.sources)) {
      image.srcset = item.sources.filter(source => app.localImage(source.image) && Number.isInteger(source.width) && source.width > 0).map(source => source.image + ' ' + source.width + 'w').join(', ');
      image.sizes = '(max-width: 760px) calc((100vw - 58px) / 2), (max-width: 1200px) 30vw, 400px';
    }
    image.loading = 'lazy'; image.decoding = 'async';
    let wrapper = image;
    if (enlarge) {
      wrapper = app.node('button', 'gallery-open'); wrapper.type = 'button';
      wrapper.dataset.galleryId = item.id;
      wrapper.setAttribute('aria-label', app.t('gallery.open') + ': ' + app.localize(item.alt));
      wrapper.append(image, app.node('span', 'gallery-zoom', '↗'));
      wrapper.lastChild.setAttribute('aria-hidden', 'true');
      wrapper.addEventListener('click', () => { lightboxItem = item; renderLightbox(); app.openDialog('lightbox-dialog', wrapper); });
    }
    image.addEventListener('error', () => wrapper.replaceWith(placeholder(category, label)), { once: true });
    return wrapper;
  }
  function renderLightbox() {
    if (!lightboxItem) return;
    const content = document.querySelector('#lightbox-content');
    const image = app.node('img', 'lightbox-image');
    if (Number.isInteger(lightboxItem.width) && Number.isInteger(lightboxItem.height)) {
      image.width = lightboxItem.width; image.height = lightboxItem.height;
    }
    image.alt = app.localize(lightboxItem.alt); image.src = app.localImage(lightboxItem.image);
    image.addEventListener('error', () => content.replaceChildren(app.node('p', '', app.t('gallery.unavailable'))), { once: true });
    content.replaceChildren(image, app.node('p', 'lightbox-caption', app.localize(lightboxItem.alt)));
  }
  function selectGallery(index, revealThumbnail = false) {
    if (!galleryItems.length) return;
    const item = galleryItems[(index + galleryItems.length) % galleryItems.length];
    galleryId = item.id;
    const { open, image, caption, position, thumbnails, previous, next } = galleryView;
    open.dataset.galleryId = item.id;
    open.setAttribute('aria-label', app.t('gallery.open') + ': ' + app.localize(item.alt));
    image.alt = app.localize(item.alt);
    image.width = item.width || 900; image.height = item.height || 650;
    image.srcset = (item.sources || []).filter(source => app.localImage(source.image) && Number.isInteger(source.width) && source.width > 0).map(source => source.image + ' ' + source.width + 'w').join(', ');
    image.src = app.localImage(item.image);
    image.hidden = false; open.disabled = false;
    caption.textContent = app.t(galleryKeys[item.category]);
    position.textContent = app.t('gallery.position').replace('{current}', galleryItems.indexOf(item) + 1).replace('{total}', galleryItems.length);
    previous.disabled = next.disabled = galleryItems.length < 2;
    for (const button of thumbnails.children) {
      const active = button.dataset.galleryThumb === galleryId;
      button.setAttribute('aria-pressed', String(active));
      button.tabIndex = active ? 0 : -1;
      // Only scroll the preview strip, never move the page when changing photos.
      if (active && revealThumbnail) {
        const edge = button.getBoundingClientRect().left - thumbnails.getBoundingClientRect().left + thumbnails.scrollLeft;
        if (edge < thumbnails.scrollLeft) thumbnails.scrollLeft = edge;
        else if (edge + button.offsetWidth > thumbnails.scrollLeft + thumbnails.clientWidth) thumbnails.scrollLeft = edge + button.offsetWidth - thumbnails.clientWidth;
      }
    }
  }
  function moveGallery(step) {
    selectGallery(galleryItems.findIndex(item => item.id === galleryId) + step, true);
  }
  function createGallery() {
    const grid = document.querySelector('#gallery-grid');
    grid.classList.add('gallery-viewer');
    grid.setAttribute('role', 'group');
    const stage = app.node('div', 'gallery-stage');
    const figure = app.node('figure', 'gallery-main');
    const open = app.node('button', 'gallery-open gallery-main-open');
    open.type = 'button';
    open.setAttribute('aria-haspopup', 'dialog');
    open.setAttribute('aria-controls', 'lightbox-dialog');
    const image = app.node('img', 'gallery-main-image');
    image.id = 'gallery-main-image';
    image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
    image.sizes = '(max-width: 420px) calc(100vw - 36px), (max-width: 760px) calc(100vw - 40px), (max-width: 1200px) calc(100vw - 200px), 1112px';
    const zoom = app.node('span', 'gallery-zoom', '↗'); zoom.setAttribute('aria-hidden', 'true');
    open.append(image, zoom);
    const caption = app.node('figcaption', 'gallery-caption');
    figure.append(open, caption);
    const arrow = (className, symbol, step) => {
      const button = app.node('button', 'gallery-arrow ' + className);
      button.type = 'button'; button.setAttribute('aria-controls', image.id);
      const icon = app.node('span', '', symbol); icon.setAttribute('aria-hidden', 'true');
      button.append(icon); button.addEventListener('click', () => moveGallery(step));
      return button;
    };
    const previous = arrow('gallery-previous', '←', -1);
    const next = arrow('gallery-next', '→', 1);
    const position = app.node('p', 'gallery-position');
    position.setAttribute('role', 'status'); position.setAttribute('aria-atomic', 'true');
    stage.append(previous, figure, next, position);
    const thumbnails = app.node('div', 'gallery-thumbnails'); thumbnails.setAttribute('role', 'group');
    grid.replaceChildren(stage, thumbnails);
    galleryView = { grid, stage, open, image, caption, position, thumbnails, previous, next };
    image.addEventListener('error', () => {
      image.hidden = true; open.disabled = true;
      caption.textContent = app.t('gallery.unavailable');
    });
    let gesture = null;
    let suppressClick = false;
    open.addEventListener('pointerdown', event => {
      suppressClick = false;
      if (!event.isPrimary) { gesture = null; return; }
      if (!['touch', 'pen'].includes(event.pointerType)) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
      open.setPointerCapture(event.pointerId);
    });
    open.addEventListener('pointercancel', () => { gesture = null; });
    open.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        suppressClick = true;
        if (galleryItems.length > 1) moveGallery(dx < 0 ? 1 : -1);
      }
    });
    open.addEventListener('click', event => {
      if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
      const item = galleryItems.find(entry => entry.id === galleryId);
      if (!item) return;
      lightboxItem = item; renderLightbox(); app.openDialog('lightbox-dialog', open);
    });
    thumbnails.addEventListener('click', event => {
      const button = event.target.closest('[data-gallery-thumb]');
      if (button) selectGallery(galleryItems.findIndex(item => item.id === button.dataset.galleryThumb), true);
    });
    grid.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = galleryItems.findIndex(item => item.id === galleryId);
      selectGallery(event.key === 'Home' ? 0 : event.key === 'End' ? galleryItems.length - 1 : index + (event.key === 'ArrowLeft' ? -1 : 1), true);
      if (event.target.closest('[data-gallery-thumb]')) thumbnails.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
    });
  }
  function renderGallery() {
    const gallery = data.gallery.filter(item => Object.hasOwn(galleryKeys, item.category) && app.localImage(item.image) && translated(item.alt));
    if (!galleryView) createGallery();
    const { grid, stage, thumbnails, previous, next } = galleryView;
    const focusedThumbnail = thumbnails.contains(document.activeElement);
    document.querySelectorAll('[data-gallery-filter]').forEach(button => {
      button.hidden = button.dataset.galleryFilter !== 'all' && !gallery.some(item => item.category === button.dataset.galleryFilter);
      button.setAttribute('aria-pressed', String(button.dataset.galleryFilter === galleryCategory));
    });
    galleryItems = gallery.filter(item => galleryCategory === 'all' || item.category === galleryCategory);
    grid.setAttribute('aria-label', app.t('gallery.viewer'));
    thumbnails.setAttribute('aria-label', app.t('gallery.thumbnails'));
    previous.setAttribute('aria-label', app.t('gallery.previous'));
    next.setAttribute('aria-label', app.t('gallery.next'));
    stage.hidden = !galleryItems.length;
    thumbnails.replaceChildren(...galleryItems.map((item, index) => {
      const button = app.node('button', 'gallery-thumbnail'); button.type = 'button';
      button.dataset.galleryThumb = item.id;
      button.setAttribute('aria-controls', 'gallery-main-image');
      button.setAttribute('aria-label', app.t('gallery.select') + ' ' + (index + 1) + ': ' + app.localize(item.alt));
      const image = app.node('img', '');
      image.src = app.localImage(item.thumbnail) || app.localImage(item.image);
      image.alt = app.localize(item.alt); image.width = item.width || 900; image.height = item.height || 650;
      image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
      image.addEventListener('error', () => { image.hidden = true; button.textContent = String(index + 1); }, { once: true });
      button.append(image);
      return button;
    }));
    selectGallery(Math.max(0, galleryItems.findIndex(item => item.id === galleryId)), true);
    if (focusedThumbnail) thumbnails.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
    renderLightbox();
  }
  document.querySelector('.gallery-filters').hidden = false;
  document.querySelectorAll('[data-gallery-filter]').forEach(button => button.addEventListener('click', () => {
    galleryCategory = button.dataset.galleryFilter;
    renderGallery();
  }));

  function renderMenu() {
    const dishes = data.menu.filter(item => item.category === menuCategory && translated(item.name) && translated(item.description));
    const grid = document.querySelector('#menu-dishes');
    grid.replaceChildren();
    grid.hidden = dishes.length === 0;
    document.querySelector('#menu-content').hidden = dishes.length > 0;
    dishes.forEach(item => {
      const card = app.node('article', 'dish-card');
      if (item.image) card.append(picture(item, 'food', app.localize(item.name)));
      const body = app.node('div', 'dish-copy');
      body.append(app.node('h3', '', app.localize(item.name)), app.node('p', '', app.localize(item.description)));
      let price = app.t('menu.pricePending');
      if (typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0 && /^[A-Z]{3}$/.test(item.currency || '')) {
        try { price = new Intl.NumberFormat(app.language, { style: 'currency', currency: item.currency }).format(item.price); } catch { /* Keep pending text for invalid currency. */ }
      }
      body.append(app.node('p', 'dish-price', price));
      const badges = app.node('div', 'dish-badges');
      for (const flag of ['popular', 'spicy', 'vegetarian']) if (item[flag] === true) badges.append(app.node('span', '', app.t('menu.' + flag)));
      body.append(badges); card.append(body); grid.append(card);
    });
  }
  document.addEventListener('siam:menu', event => { menuCategory = event.detail.category; renderMenu(); });

  app.confirmedEvents = () => data.events.filter((item, index, entries) =>
    typeof item.id === 'string' && /^[a-z0-9-]+$/.test(item.id) && entries.findIndex(other => other.id === item.id) === index &&
    translated(item.title) && translated(item.description) && app.validDate(item.date) &&
    (!item.time || /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)) && Object.hasOwn(config.locations, item.location)
  );
  function eventCard(item, past) {
    const card = app.node('article', 'event-card');
    card.append(picture(item, 'events', app.localize(item.title), past));
    const body = app.node('div', 'event-copy');
    const categoryKey = 'category.' + item.category;
    body.append(app.node('p', 'eyebrow', app.t(past ? 'events.past' : 'events.upcoming')));
    body.append(app.node('h3', '', app.localize(item.title)));
    const date = app.node('time', 'event-date', app.formatDate(item.date) + ' · ' + (item.time || app.t('events.timePending')));
    date.dateTime = item.date + (item.time ? 'T' + item.time + ':00+07:00' : '');
    body.append(date, app.node('p', 'event-location', config.locations[item.location].name));
    if (Object.hasOwn(window.SIAM_TRANSLATIONS.en, categoryKey)) body.append(app.node('p', 'event-category', app.t(categoryKey)));
    body.append(app.node('p', '', app.localize(item.description)));
    if (!past && item.reservationEnabled === true) {
      const button = app.node('button', 'button button-gold', app.t('events.reserve'));
      button.type = 'button'; button.dataset.openDialog = 'table-dialog'; button.dataset.eventId = item.id; button.dataset.location = item.location;
      body.append(button);
    }
    card.append(body);
    return card;
  }
  function renderEvents() {
    const events = app.confirmedEvents();
    const upcoming = events.filter(item => item.date >= app.today()).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    const past = events.filter(item => item.date < app.today()).sort((a, b) => b.date.localeCompare(a.date));
    const grid = document.querySelector('#events-grid');
    grid.replaceChildren(...upcoming.map(item => eventCard(item, false)));
    grid.hidden = !upcoming.length;
    document.querySelector('#events-empty').hidden = !!upcoming.length;
    document.querySelector('#event-archive').hidden = !past.length;
    document.querySelector('#past-events-grid').replaceChildren(...past.map(item => eventCard(item, true)));
  }

  if (app.localImage(config.logo)) document.querySelectorAll('.brand').forEach(brand => {
    const image = app.node('img', 'original-logo'); image.alt = 'Siam Lounge Pattaya';
    image.hidden = true;
    image.addEventListener('load', () => { image.hidden = false; brand.querySelector('.brand-name').hidden = true; });
    image.addEventListener('error', () => image.remove(), { once: true });
    image.src = config.logo; brand.prepend(image);
  });
  function render() { app.renderContacts(); renderEvents(); renderMenu(); renderGallery(); }
  document.addEventListener('siam:language', render);
  render();
})();
