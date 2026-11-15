(() => {
  'use strict';

  const get = (q, el = document) => el.querySelector(q);
  const all = (q, el = document) => Array.from(el.querySelectorAll(q));
  const groups = window.LJW_CASES || [];
  const order = ['yingjun-reno', 'solar-distance', 'yingjun-a7', 'earth-flat', 'yingjun-huawei', 'sound-candle'];
  const visualCrops = {
    'yingjun-reno': '50% 45%', 'yingjun-a7': '50% 45%', 'yingjun-huawei': '50% 47%',
    'solar-distance': '50% 50%', 'earth-flat': '50% 50%', 'sound-candle': '50% 50%'
  };
  const films = order.map(id => {
    const group = groups.find(g => g.films.some(f => f.id === id));
    return group && { group, film: group.films.find(f => f.id === id) };
  }).filter(Boolean);

  const element = (tag, cls, content) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (content) el.textContent = content;
    return el;
  };
  const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const cards = films.map(({ group, film }, index) => {
    const a = element('a', 'gallery-card');
    a.href = '#' + film.id;
    a.dataset.group = group.id;

    const image = element('span', 'gallery-image');
    const photo = new Image();
    photo.src = film.poster;
    photo.alt = '';
    photo.loading = 'lazy';
    photo.decoding = 'async';
    photo.style.objectPosition = visualCrops[film.id];
    const number = element('span', 'gallery-number', String(index + 1).padStart(2, '0'));
    const arrow = element('span', 'gallery-arrow', '↗');
    number.setAttribute('aria-hidden', 'true');
    arrow.setAttribute('aria-hidden', 'true');
    image.append(photo, number, arrow);
    a.append(image, element('p', 'gallery-meta', [group.name, group.field].join('  /  ')), element('h3', '', film.name));
    return a;
  });
  get('#gallery-items').append(...cards);

  const filters = all('[data-gallery-filter]');
  function updateFilter(value, announce) {
    filters.forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.galleryFilter === value)));
    let visible = 0;
    cards.forEach(card => {
      card.hidden = value !== 'all' && card.dataset.group !== value;
      card.classList.toggle('is-offset', !card.hidden && visible % 2 > 0);
      if (!card.hidden) visible++;
    });
    if (announce) get('#gallery-status').textContent = '已显示 ' + visible + ' 条作品';
  }
  updateFilter('all', false);
  filters.forEach(btn => btn.addEventListener('click', () => updateFilter(btn.dataset.galleryFilter, true)));

  films.forEach(({ film }, index) => {
    const panel = document.getElementById('work-' + film.id);
    if (!panel) return;
    const nav = element('nav', 'case-next');
    nav.setAttribute('aria-label', '作品浏览');
    const gallery = element('a', '', '↑ 回作品画廊');
    gallery.href = '#works';
    const nextFilm = films[(index + 1) % films.length].film;
    const next = element('a', '', '下一条作品 ↗');
    next.href = '#' + nextFilm.id;
    next.setAttribute('aria-label', '下一条作品：' + nextFilm.name);
    nav.append(gallery, next);
    panel.append(nav);
  });

  function focusCase(link, event) {
    if (event.detail !== 0) return;
    const id = link.hash.slice(1);
    if (!order.includes(id)) return;
    const title = get('#work-' + id + ' .film-copy h4');
    if (!title) return;
    // Let the hash handler reveal the chosen tab before sending focus to its title.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    }));
  }
  [...cards, ...all('.case-next a')].forEach(link => link.addEventListener('click', e => focusCase(link, e)));

  const preview = get('#reel-preview');
  const dialog = get('#reel-dialog');
  const trigger = get('.reel-stage');
  const player = get('#reel-player');
  const close = get('.reel-close');
  let inView = false, started = false;
  const load = media => {
    if (!media.hasAttribute('src')) media.src = media.dataset.src;
  };
  function previewState() {
    if (!inView || document.hidden || dialog.open || mediaQuery.matches) {
      preview.pause();
      return;
    }
    load(preview);
    preview.play().catch(() => {});
  }
  trigger.addEventListener('click', () => {
    if (dialog.open) return;
    all('.film-panel video').forEach(video => video.pause());
    preview.pause();
    dialog.showModal();
    document.body.classList.add('reel-open');
    load(player);
    if (started) player.currentTime = 0;
    started = true;
    player.play().catch(() => {});
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  get('.reel-dialog-foot a').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    player.pause();
    document.body.classList.remove('reel-open');
    previewState();
  });
  mediaQuery.addEventListener('change', previewState);
  document.addEventListener('visibilitychange', previewState);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting && entries[0].intersectionRatio >= .17;
      previewState();
    }, { threshold: [.17] }).observe(trigger);
    new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting));
    }).observe(get('.ai-marquee'));
    if (!mediaQuery.matches) {
      const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('studio-in');
        reveal.unobserve(entry.target);
      }), { threshold: .12 });
      [...cards, get('.gallery-head'), get('.studio-intro')].forEach(el => {
        if (el.getBoundingClientRect().top < innerHeight) return;
        el.classList.add('studio-reveal');
        reveal.observe(el);
      });
    }
  } else {
    inView = true;
    previewState();
    get('.ai-marquee').classList.add('in-view');
  }

  const precise = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 761px)');
  const cursor = element('div', 'studio-cursor');
  cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);
  function hideCursor() {
    document.body.classList.remove('has-media-cursor');
    cursor.classList.remove('is-active');
  }
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !precise.matches || mediaQuery.matches || dialog.open) return hideCursor();
    const area = e.target.closest('.reel-stage, .gallery-image');
    if (!area) return hideCursor();
    cursor.style.setProperty('--cue-x', e.clientX + 'px');
    cursor.style.setProperty('--cue-y', e.clientY + 'px');
    cursor.textContent = area.classList.contains('reel-stage') ? '▷' : '↗';
    document.body.classList.add('has-media-cursor');
    cursor.classList.add('is-active');
  }, { passive: true });
  document.addEventListener('pointerleave', hideCursor);
  addEventListener('scroll', hideCursor, { passive: true });
  addEventListener('blur', hideCursor);
  precise.addEventListener('change', hideCursor);
  mediaQuery.addEventListener('change', hideCursor);
})();
