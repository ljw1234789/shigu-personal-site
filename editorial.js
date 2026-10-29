(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const signal = document.querySelector('.signal-lines');
  if (signal) {
    for (let i = 0; i < 60; i++) {
      const x = i * 23 - 80;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x} -12 C${x+120} 4 ${x+20} 25 ${x+145} 36 S${x+205} 64 ${x+300} 84`);
      signal.append(path);
    }
  }
  document.querySelectorAll('.homepage-tool,.tool-showcase').forEach(el=>el.setAttribute('data-reveal',''));
  const targets = [...document.querySelectorAll('[data-reveal]')];
  let observer;
  const paused = () => reduced.matches || document.body.classList.contains('is-paused');
  function revealAll() { targets.forEach(el=>el.classList.add('is-revealed')); }
  if ('IntersectionObserver' in window && !paused()) {
    try {
      observer = new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      }, {threshold:0.08, rootMargin:'0px 0px -12px 0px'});
      root.classList.add('motion-ready');
      targets.forEach(el=>observer.observe(el));
    } catch { root.classList.remove('motion-ready'); revealAll(); }
  } else revealAll();
  // Never intercept scrolling: a single scheduled update moves only decorative lines.
  let frame = 0;
  const hero = document.getElementById('intro');
  function update() {
    frame = 0;
    const height = root.scrollHeight - innerHeight;
    root.style.setProperty('--reading-progress', height > 0 ? Math.min(1, Math.max(0, scrollY / height)) : 0);
    if (!paused() && hero) root.style.setProperty('--signal-progress', Math.min(1, Math.max(0, scrollY / hero.offsetHeight)));
  }
  function schedule() { if (!frame) frame=requestAnimationFrame(update); }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  reduced.addEventListener('change',()=>{if(reduced.matches)revealAll();schedule();});
  new MutationObserver(()=>{if(paused())revealAll();schedule();}).observe(document.body,{attributes:true,attributeFilter:['class']});
  schedule();
})();
