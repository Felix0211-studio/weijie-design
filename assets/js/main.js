/* ============================================================
   上海维界设计 · WEIJIE DESIGN
   main.js — navigation, reveals, parallax, filtering, transitions
   ============================================================ */
(() => {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  const pageMain = document.querySelector('main');
  const pageFooter = document.querySelector('footer');

  /* ---------- intro state ---------- */
  const markLoaded = () => body.classList.add('is-loaded');
  if (document.readyState === 'complete') {
    requestAnimationFrame(() => requestAnimationFrame(markLoaded));
  } else {
    window.addEventListener('load', () => requestAnimationFrame(markLoaded), { once: true });
    // Safari / slow font situations: never leave the hero hidden.
    setTimeout(markLoaded, 900);
  }

  /* ---------- year ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- mobile navigation ---------- */
  let menuOpen = false;

  const setMenu = (open, focusTarget = true) => {
    if (!menuToggle || !mobileNav) return;
    menuOpen = open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    mobileNav.classList.toggle('is-open', open);
    mobileNav.setAttribute('aria-hidden', String(!open));
    if ('inert' in HTMLElement.prototype) {
      mobileNav.inert = !open;
      if (pageMain) pageMain.inert = open;
      if (pageFooter) pageFooter.inert = open;
    }
    body.classList.toggle('is-locked', open);
    if (header) {
      header.classList.toggle('is-menu-open', open);
      if (open) header.classList.remove('is-hidden');
    }
    if (open && focusTarget) {
      const first = mobileNav.querySelector('a, button');
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 260);
    }
    if (!open && focusTarget && menuToggle) menuToggle.focus({ preventScroll: true });
  };

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => setMenu(!menuOpen));
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenu(false, false));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuOpen) {
        setMenu(false);
        return;
      }
      if (!menuOpen || event.key !== 'Tab') return;
      const focusables = [
        ...document.querySelectorAll('.site-header a, .site-header button, [data-mobile-nav] a, [data-mobile-nav] button')
      ].filter((el) => !el.disabled && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && menuOpen) setMenu(false, false);
    });
    setMenu(false, false);
  }

  /* ---------- header & hero parallax ---------- */
  let lastScroll = window.scrollY || 0;
  let ticking = false;

  const updateOnScroll = () => {
    const y = window.scrollY || 0;
    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
      if (!menuOpen) {
        const canHide = window.innerWidth > 900;
        if (canHide && y > 560 && y > lastScroll + 6) header.classList.add('is-hidden');
        else if (!canHide || y < lastScroll - 6 || y < 560) header.classList.remove('is-hidden');
      }
    }

    if (!reducedMotion) {
      const hero = document.querySelector('.hero');
      if (hero && y < window.innerHeight * 1.3) {
        const arch = hero.querySelector('.hero__arch');
        const orb = hero.querySelector('.hero__orb');
        const light = hero.querySelector('.hero__light');
        if (arch) arch.style.transform = 'translate3d(0,' + (y * 0.075).toFixed(2) + 'px,0)';
        if (orb) orb.style.transform = 'translate3d(0,' + (y * -0.04).toFixed(2) + 'px,0)';
        if (light) light.style.transform = 'translate3d(0,' + (y * 0.035).toFixed(2) + 'px,0)';
      }
    }

    lastScroll = y;
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateOnScroll);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  updateOnScroll();

  /* ---------- reveal on scroll ---------- */
  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
  if (revealItems.length) {
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((el) => el.classList.add('is-in'));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
      );
      revealItems.forEach((el) => observer.observe(el));
    }
  }

  /* ---------- work filters (works.html) ---------- */
  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const workItems = Array.from(document.querySelectorAll('[data-category]'));
  const workCount = document.querySelector('[data-works-count]');
  const emptyState = document.querySelector('[data-works-empty]');
  const worksGrid = document.querySelector('.works-list');
  const hideTimers = new WeakMap();

  const applyFilter = (category) => {
    if (!workItems.length) return;
    let visible = 0;

    filterButtons.forEach((button) => {
      const active = button.dataset.filter === category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    workItems.forEach((item) => {
      const matches = category === 'all' || item.dataset.category === category;
      const timer = hideTimers.get(item);
      if (timer) clearTimeout(timer);

      if (matches) {
        visible += 1;
        item.hidden = false;
        requestAnimationFrame(() => item.classList.remove('is-filtered'));
      } else {
        item.classList.add('is-filtered');
        hideTimers.set(
          item,
          setTimeout(() => {
            item.hidden = true;
          }, reducedMotion ? 0 : 320)
        );
      }
    });

    if (worksGrid) worksGrid.classList.toggle('is-filtering', category !== 'all');
    if (workCount) workCount.textContent = String(visible).padStart(2, '0') + (visible === 1 ? ' PROJECT' : ' PROJECTS');
    if (emptyState) emptyState.classList.toggle('is-visible', visible === 0);
  };

  if (filterButtons.length) {
    filterButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
      button.addEventListener('click', () => applyFilter(button.dataset.filter));
    });
  }

  /* ---------- soft page transition ---------- */
  if (!reducedMotion) {
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a');
      if (!link) return;
      if (link.target && link.target !== '_self') return;
      if (link.hasAttribute('download') || link.dataset.noTransition !== undefined) return;

      const href = link.getAttribute('href');
      if (!href || href.indexOf('#') === 0 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;

      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (error) {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (!/\.html?$/.test(url.pathname)) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        if (url.hash) {
          event.preventDefault();
          const target = document.querySelector(url.hash);
          if (target) {
            target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
            history.pushState(null, '', url.hash);
          }
        }
        return;
      }

      event.preventDefault();
      body.classList.add('is-leaving');
      window.setTimeout(() => {
        window.location.href = link.href;
      }, 300);
    });

    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        body.classList.remove('is-leaving');
        markLoaded();
      }
    });
  }

  /* ---------- gentle keyboard support for filter groups ---------- */
  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const enabled = filterButtons.filter((item) => !item.disabled);
      const index = enabled.indexOf(button);
      const next = event.key === 'ArrowRight' ? enabled[(index + 1) % enabled.length] : enabled[(index - 1 + enabled.length) % enabled.length];
      if (next) {
        event.preventDefault();
        next.focus();
      }
    });
  });
})();
