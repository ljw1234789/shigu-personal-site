(() => {
  document.addEventListener('DOMContentLoaded',()=>{const scenery=document.querySelector('body>.wallpaper');if(scenery){const copy=scenery.cloneNode(true);copy.classList.add('hero-scenery');document.querySelector('.portfolio-hero').prepend(copy)}},{once:true});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const root=document.documentElement;
  const revealTargets=[...document.querySelectorAll('[data-reveal],.case-card,.homepage-tool')];
  const targets=[...document.querySelectorAll('[data-resolve]')];
  const timers=new Map(), originals=new Map(targets.map(el=>[el,el.textContent]));
  const paused=()=>document.body.classList.contains('is-paused')||reduced.matches;
  function stopText(){timers.forEach(clearInterval);timers.clear();originals.forEach((text,el)=>{el.textContent=text})}
  function resolve(el){
    if(el.dataset.resolved)return;el.dataset.resolved='true';
    const original=originals.get(el);if(paused())return;
    const chars=[...original];el.setAttribute('aria-label',original);
    el.innerHTML=chars.map(c=>`<span class="resolve-char" aria-hidden="true">${c}</span>`).join('');
    const spans=[...el.children], glyphs='＋×—·';const start=performance.now();
    const id=setInterval(()=>{const t=performance.now()-start;spans.forEach((span,i)=>{const done=t>110+i*35;span.classList.toggle('is-resolving',!done);span.textContent=done?chars[i]:glyphs[(Math.floor(t/75)+i)%glyphs.length]});if(t>chars.length*35+240){clearInterval(id);timers.delete(el);el.textContent=original}},65);timers.set(el,id);
  }
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target)}}),{threshold:.08});
  if(!reduced.matches)root.classList.add('craft-motion');revealTargets.forEach(el=>observer.observe(el));
  const textObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&!root.classList.contains('intro-pending'))resolve(entry.target)}),{threshold:.6});targets.forEach(el=>textObserver.observe(el));
  new MutationObserver(()=>{if(paused())stopText()}).observe(document.body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(()=>{if(!root.classList.contains('intro-pending'))targets.forEach(el=>{const r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)resolve(el)})}).observe(root,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',()=>{if(reduced.matches){stopText();root.classList.remove('craft-motion');revealTargets.forEach(el=>el.classList.add('revealed'))}});
  addEventListener('pagehide',stopText);
})();
