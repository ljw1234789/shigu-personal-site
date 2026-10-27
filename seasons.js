(() => {
  'use strict';
  const root = document.documentElement;
  const toggle = document.getElementById('season-toggle');
  const panel = document.getElementById('season-panel');
  const autoButton = document.getElementById('season-auto');
  if (!toggle || !panel || !autoButton) return;
  const seasons = ['spring', 'summer', 'autumn', 'winter'];
  const names = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
  const colors = { spring: '#2a3930', summer: '#273642', autumn: '#403328', winter: '#303236' };
  const storageKey = 'ljw-desktop-season-v1';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const month = new Date().getMonth();
  let season = seasons[Math.floor(((month + 10) % 12) / 3)];
  let auto = true, timer = null;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && seasons.includes(saved.season)) season = saved.season;
    if (saved && typeof saved.auto === 'boolean') auto = saved.auto;
  } catch {}

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ season, auto })); } catch {}
  }
  function render() {
    root.dataset.season = season;
    toggle.textContent = names[season];
    toggle.setAttribute('aria-label', `四季主题：${names[season]}，点击切换`);
    toggle.title = `四季主题 · ${names[season]}`;
    toggle.parentElement.classList.toggle('is-auto', auto);
    panel.querySelectorAll('[data-season-option]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.seasonOption === season));
    });
    autoButton.setAttribute('aria-pressed', String(auto));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[season]);
  }
  function schedule() {
    clearTimeout(timer);
    if (!auto || reduced.matches || document.hidden || document.body.classList.contains('is-paused') || root.classList.contains('intro-pending')) return;
    timer = setTimeout(() => {
      season = seasons[(seasons.indexOf(season) + 1) % seasons.length];
      render();
      schedule();
    }, 22000);
  }
  function closePanel() { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
  });
  panel.querySelectorAll('[data-season-option]').forEach(button => {
    button.addEventListener('click', () => {
      season = button.dataset.seasonOption;
      auto = false;
      render(); save(); schedule();
    });
  });
  autoButton.addEventListener('click', () => { auto = !auto; render(); save(); schedule(); });
  document.addEventListener('click', event => { if (!event.target.closest('.season-control')) closePanel(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault(); event.stopImmediatePropagation(); closePanel(); toggle.focus();
    }
  }, true);
  reduced.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);
  new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(schedule).observe(root, { attributes: true, attributeFilter: ['class'] });
  addEventListener('pagehide', () => clearTimeout(timer));
  addEventListener('pageshow', schedule);

  // Paint the chosen season immediately; only subsequent changes crossfade.
  root.classList.add('season-instant');
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('season-instant')));
  schedule();
})();
