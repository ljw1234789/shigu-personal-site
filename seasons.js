(() => {
  'use strict';
  const root = document.documentElement;
  const toggle = document.getElementById('season-toggle');
  const panel = document.getElementById('season-panel');
  const autoButton = document.getElementById('season-auto');
  if (!toggle || !panel || !autoButton) return;
  // Small original vector scenes make each season readable, even around a narrow desktop window.
  function buildSeasonScenery() {
    const spring = document.querySelector('.spring-weather');
    const autumn = document.querySelector('.autumn-weather');
    const summer = document.querySelector('.summer-weather');
    const winter = document.querySelector('.winter-weather');
    const flower = `<svg viewBox="-42 -42 84 84" aria-hidden="true"><g fill="currentColor" stroke="#fff8" stroke-width="1.2">${Array.from({length:5},(_,i)=>`<path transform="rotate(${i*72})" d="M0 0C-24-4-29-31-14-35C-7-38-2-33 0-29C3-35 12-38 18-31C28-18 15-3 0 0Z"/>`).join('')}</g><circle r="9" fill="#f8d68b"/><g fill="#966234">${Array.from({length:7},(_,i)=>`<circle cx="${Math.cos(i*6.283/7)*5.5}" cy="${Math.sin(i*6.283/7)*5.5}" r="1.2"/>`).join('')}</g></svg>`;
    const leaf = `<svg viewBox="0 0 70 82" aria-hidden="true"><path fill="currentColor" d="m35 3 8 18 9-8-1 20 15-5-8 18 10 5-25 12-5 16-5-1 3-16L8 55l9-8L3 31l17 3-3-18 13 9Z"/><path d="M36 66 35 18m1 35L17 38m19 9 17-12m-17 24 19-9" fill="none" stroke="#753d2870" stroke-width="1.6" stroke-linecap="round"/></svg>`;
    if (spring) {
      const blooms = [[3,9,54,-20],[94,18,45,25],[5,72,44,-12],[13,83,59,8],[25,89,36,-5],[79,86,46,-15],[91,77,64,18],[98,65,38,25],[47,94,32,0]];
      spring.innerHTML = `<div class="spring-meadow"></div>${blooms.map(([x,y,size,angle],i)=>`<div class="bloom" style="--x:${x}%;--y:${y}%;--size:${size}px;--angle:${angle}deg;--delay:${i*.18}s"><div class="flower-stem"></div><div class="bloom-head">${flower}</div></div>`).join('')}<div class="petal-shower">${Array.from({length:13},(_,i)=>`<span class="falling-petal" style="--x:${(i*31+6)%100}%;--drift:${(i%2?1:-1)*(35+i*4)}px;--duration:${15+i%5*2}s;--delay:-${i*2.1}s;--size:${10+i%4*3}px"><i></i></span>`).join('')}</div>`;
    }
    if (autumn) {
      autumn.innerHTML = `<div class="autumn-glow"></div><div class="leaf-fall">${Array.from({length:24},(_,i)=>`<span class="falling-leaf leaf-tone-${i%4}" style="--x:${(i*37+3)%100}%;--drift:${(i%2?1:-1)*(50+i%6*18)}px;--duration:${13+i%7*1.7}s;--delay:-${i*1.83}s;--size:${23+i%5*6}px;--spin:${i%2?240:-210}deg">${leaf}</span>`).join('')}</div><div class="leaf-bed">${Array.from({length:15},(_,i)=>`<span class="resting-leaf leaf-tone-${i%4}" style="left:${i*7-2}%;bottom:${i%3*8}px;width:${28+i%4*9}px;rotate:${i*43}deg">${leaf}</span>`).join('')}</div>`;
    }
    if (summer) summer.insertAdjacentHTML('beforeend', `<div class="sea-sparkles">${Array.from({length:9},(_,i)=>`<i style="left:${10+i*10}%;top:${i%3*18}px;--delay:-${i*.6}s"></i>`).join('')}</div>`);
    if (winter) winter.insertAdjacentHTML('beforeend', `<svg class="snow-banks" viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden="true"><path fill="#e7eff6" d="M0 55Q150 0 360 70T740 65T1150 45T1440 75V180H0Z"/><path fill="#fff" d="M0 100Q220 25 430 105T830 92T1180 80T1440 105V180H0Z"/></svg><div class="snow-crystals">${[8,89,25,76,47].map((x,i)=>`<span style="--x:${x}%;--y:${[19,39,78,85,6][i]}%;--size:${15+i%3*8}px;--delay:-${i*2}s"><svg viewBox="0 0 40 40" aria-hidden="true"><g stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round">${[0,60,120].map(a=>`<path transform="rotate(${a} 20 20)" d="M20 3v34M14 7l6 6 6-6M14 33l6-6 6 6"/>`).join('')}</g></svg></span>`).join('')}</div>`);
  }
  buildSeasonScenery();
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
