(() => {
  'use strict';
  const root = document.documentElement;
  const curtain = document.getElementById('site-entrance');
  if (!curtain) return;
  if (!root.classList.contains('intro-pending')) { curtain.remove(); return; }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const surfaces = [...document.querySelectorAll('.desktop-bar, #desktop, .desktop-bottom, [data-intro-surface]')];
  let finished = false, fallback;
  surfaces.forEach(el => { el.inert = true; el.setAttribute('data-intro-inert', ''); });

  function finish(settled = false) {
    if (finished) return;
    finished = true;
    clearTimeout(fallback);
    const returnFocus = curtain.contains(document.activeElement);
    surfaces.forEach(el => { el.inert = false; el.removeAttribute('data-intro-inert'); });
    // Remove the pending curtain immediately; let the desktop settle before removing its animation class.
    root.classList.remove('intro-pending');
    curtain.remove();
    const settleDesktop = () => {
      document.querySelector('.home-window')?.classList.add('entrance-complete');
      root.classList.remove('intro-running');
    };
    if (settled === true) setTimeout(settleDesktop, 350);
    else settleDesktop();
    try { sessionStorage.setItem('ljw-intro-seasons-20261027', 'seen'); } catch {}
    if (returnFocus) document.querySelector('.desktop-brand')?.focus({ preventScroll: true });
    document.removeEventListener('keydown', onKey, true);
    reduced.removeEventListener('change', onReduced);
    removeEventListener('hashchange', finish);
    removeEventListener('pagehide', finish);
  }
  function onKey(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); finish(); }
  }
  function onReduced(event) { if (event.matches) finish(); }
  curtain.querySelector('button').addEventListener('click', finish);
  curtain.addEventListener('animationend', event => { if (event.animationName === 'intro-curtain') finish(true); });
  document.addEventListener('keydown', onKey, true);
  reduced.addEventListener('change', onReduced);
  addEventListener('hashchange', finish);
  addEventListener('pagehide', finish);
  fallback = setTimeout(finish, 6200);
  root.classList.add('intro-running');
  if (reduced.matches) finish();
})();
