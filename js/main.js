(() => {
  'use strict';

  const translations = window.SIAM_TRANSLATIONS;
  if (!translations) return; // The English HTML remains usable if a script fails to load.

  const storageKey = 'siam-lounge-language';
  const nav = document.querySelector('#main-nav');
  const toggle = document.querySelector('.menu-toggle');
  const mobile = window.matchMedia('(max-width: 1023px)');
  const languageButtons = document.querySelectorAll('[data-language]');
  const languagePicker = document.querySelector('.language-picker');
  const languageToggle = document.querySelector('#language-toggle');
  const languageMenu = document.querySelector('#language-menu');
  const languageOptions = [...languageMenu.querySelectorAll('[data-language]')];
  const categoryButtons = [...document.querySelectorAll('[data-menu-category]')];
  const categoryLabel = document.querySelector('#menu-category-name');
  const categoryKeys = { breakfast: 'food.breakfast', thai: 'food.thai', german: 'food.german', european: 'food.european', drinks: 'food.beverages' };
  const locales = { en: 'en_GB', de: 'de_DE', th: 'th_TH' };
  let language = 'en';
  let menuOpen = false;

  function updateNavigation() {
    nav.hidden = mobile.matches && !menuOpen;
    toggle.hidden = !mobile.matches;
    toggle.setAttribute('aria-expanded', String(menuOpen));
    toggle.dataset.i18nAria = menuOpen ? 'nav.close' : 'nav.open';
    toggle.setAttribute('aria-label', translations[language][toggle.dataset.i18nAria]);
  }

  function closeNavigation(restoreFocus = false) {
    menuOpen = false;
    updateNavigation();
    if (restoreFocus) toggle.focus();
  }

  function closeLanguageMenu(restoreFocus = false) {
    languageMenu.hidden = true;
    languageToggle.setAttribute('aria-expanded', 'false');
    languageOptions.forEach(button => { button.tabIndex = -1; });
    if (restoreFocus) languageToggle.focus();
  }

  function focusLanguageOption(index) {
    languageOptions.forEach((button, i) => { button.tabIndex = i === index ? 0 : -1; });
    languageOptions[index].focus();
  }

  function openLanguageMenu(index = languageOptions.findIndex(button => button.dataset.language === language)) {
    languageMenu.hidden = false;
    languageToggle.setAttribute('aria-expanded', 'true');
    focusLanguageOption(index);
  }

  function setLanguage(nextLanguage, announce = false) {
    if (!Object.hasOwn(translations, nextLanguage)) return;
    language = nextLanguage;
    const copy = translations[language];
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const text = copy[element.dataset.i18n];
      if (typeof text === 'string') element.textContent = text;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const text = copy[element.dataset.i18nAria];
      if (typeof text === 'string') element.setAttribute('aria-label', text);
    });
    languageButtons.forEach(button => button.setAttribute(button.getAttribute('role') === 'menuitemradio' ? 'aria-checked' : 'aria-pressed', String(button.dataset.language === language)));
    document.title = copy['meta.title'];
    document.querySelector('meta[name="description"]').content = copy['meta.description'];
    document.querySelector('meta[property="og:title"]').content = copy['meta.title'];
    document.querySelector('meta[property="og:description"]').content = copy['meta.description'];
    document.querySelector('meta[property="og:locale"]').content = locales[language];
    updateNavigation();
    document.dispatchEvent(new CustomEvent('siam:language', { detail: { language } }));
    if (announce) document.querySelector('#language-status').textContent = copy['language.changed'];
    // Some browsers block localStorage for file:// or private browsing. Switching still works.
    try { window.localStorage.setItem(storageKey, language); } catch { /* No persistence available. */ }
  }

  document.documentElement.classList.add('js');
  document.querySelectorAll('.language-switch').forEach(element => { element.hidden = false; });
  document.querySelector('.quick-actions').hidden = false;
  document.querySelector('#copyright-year').textContent = String(new Date().getFullYear());
  let savedLanguage;
  try { savedLanguage = window.localStorage.getItem(storageKey); } catch { /* Default to English. */ }
  setLanguage(Object.hasOwn(translations, savedLanguage) ? savedLanguage : 'en');

  languageButtons.forEach(button => button.addEventListener('click', () => {
    setLanguage(button.dataset.language, true);
    if (languageMenu.contains(button)) closeLanguageMenu(true);
  }));
  languageToggle.addEventListener('click', () => {
    if (languageMenu.hidden) openLanguageMenu();
    else closeLanguageMenu(true);
  });
  languageToggle.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    openLanguageMenu(event.key === 'ArrowDown' ? 0 : languageOptions.length - 1);
  });
  languageMenu.addEventListener('keydown', event => {
    const current = languageOptions.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (current + 1) % languageOptions.length;
    if (event.key === 'ArrowUp') next = (current - 1 + languageOptions.length) % languageOptions.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = languageOptions.length - 1;
    if (next !== undefined) {
      event.preventDefault(); focusLanguageOption(next);
    }
    // Let native Tab navigation move focus before hiding the menu.
    if (event.key === 'Tab') requestAnimationFrame(() => closeLanguageMenu());
  });
  toggle.addEventListener('click', () => {
    closeLanguageMenu();
    menuOpen = !menuOpen;
    updateNavigation();
    if (menuOpen) nav.querySelector('a').focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !languageMenu.hidden) {
      event.preventDefault(); closeLanguageMenu(true); return;
    }
    if (event.key === 'Escape' && menuOpen && !document.querySelector('dialog[open]')) closeNavigation(true);
  });
  document.addEventListener('click', event => {
    if (!languageMenu.hidden && !languagePicker.contains(event.target)) closeLanguageMenu();
    if (menuOpen && !event.target.closest('.site-header')) closeNavigation();
  });
  document.addEventListener('focusin', event => {
    if (!languageMenu.hidden && !languagePicker.contains(event.target)) closeLanguageMenu();
    if (menuOpen && !event.target.closest('.site-header')) closeNavigation();
  });
  nav.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || !mobile.matches) return;
    closeNavigation();
    if (link.hasAttribute('data-open-dialog')) return;
    const section = document.querySelector(link.getAttribute('href'));
    const heading = section?.querySelector('h1, h2');
    if (heading) {
      // Let the native anchor update the URL and scroll first, then move focus.
      requestAnimationFrame(() => {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      });
    }
  });
  mobile.addEventListener('change', () => {
    const focusWasInNav = nav.contains(document.activeElement);
    closeNavigation(mobile.matches && focusWasInNav);
  });

  categoryButtons.forEach((button, index) => {
    button.disabled = false;
    button.addEventListener('click', () => {
      categoryButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      categoryLabel.dataset.i18n = categoryKeys[button.dataset.menuCategory];
      categoryLabel.textContent = translations[language][categoryLabel.dataset.i18n];
      document.dispatchEvent(new CustomEvent('siam:menu', { detail: { category: button.dataset.menuCategory } }));
    });
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % categoryButtons.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + categoryButtons.length) % categoryButtons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = categoryButtons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      categoryButtons[next].focus();
      categoryButtons[next].click();
    });
  });

  if ('IntersectionObserver' in window) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!reducedMotion.matches) {
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
        });
      }, { threshold: 0.08 });
      document.querySelectorAll('.reveal').forEach(element => {
        element.classList.add('reveal-ready');
        revealObserver.observe(element);
      });
      reducedMotion.addEventListener('change', event => {
        if (event.matches) {
          document.querySelectorAll('.reveal-ready').forEach(element => element.classList.add('is-visible'));
          revealObserver.disconnect();
        }
      });
    }
    const navLinks = [...nav.querySelectorAll('a:not([data-open-dialog])')];
    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const current = entry.target.id === 'explore' ? 'home' : entry.target.id;
        navLinks.forEach(link => {
          if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('main > section[id]').forEach(section => activeObserver.observe(section));
  }
})();
