(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),root=document.documentElement;
 const reveal=[...document.querySelectorAll('[data-reveal],.case-card')],targets=[...document.querySelectorAll('[data-resolve]')],originals=new Map(targets.map(el=>[el,el.textContent])),timers=new Map();
 const paused=()=>reduced.matches||document.body.classList.contains('is-paused');
 function finishText(){timers.forEach(clearInterval);timers.clear();originals.forEach((text,el)=>{el.textContent=text;});}
 function resolve(el){
  if(el.dataset.resolved)return;el.dataset.resolved='true';if(paused())return;
  const chars=[...originals.get(el)],glyphs='XH7#59<>',lineDelay=el.parentElement.classList.contains('hero-statement')?[...el.parentElement.children].indexOf(el)*210:0;el.setAttribute('aria-label',originals.get(el));
  el.innerHTML=chars.map((c,i)=>`<span class="resolve-char is-resolving" style="visibility:hidden" aria-hidden="true">${glyphs[i%4]}</span>`).join('');
  const spans=[...el.children],start=performance.now();const id=setInterval(()=>{const t=performance.now()-start;spans.forEach((span,i)=>{const started=t>=lineDelay+i*135,done=t>lineDelay+230+i*135;span.style.visibility=started?'visible':'hidden';span.textContent=done?chars[i]:glyphs[(Math.floor(t/75)+i)%glyphs.length];span.classList.toggle('is-resolving',!done);});if(t>lineDelay+chars.length*135+300){clearInterval(id);timers.delete(el);el.textContent=originals.get(el);}},45);timers.set(el,id);
 }
 const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');revealObserver.unobserve(e.target);}}),{threshold:.1});if(!reduced.matches)root.classList.add('craft-motion');reveal.forEach(el=>revealObserver.observe(el));
 const textObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting&&!root.classList.contains('intro-pending'))resolve(e.target);}),{threshold:.8});targets.forEach(el=>textObserver.observe(el));
 new MutationObserver(()=>{if(!root.classList.contains('intro-pending'))targets.forEach(el=>{const r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)resolve(el);});}).observe(root,{attributes:true,attributeFilter:['class']});
 new MutationObserver(()=>{if(paused())finishText();}).observe(document.body,{attributes:true,attributeFilter:['class']});
 reduced.addEventListener('change',()=>{if(reduced.matches){finishText();root.classList.remove('craft-motion');reveal.forEach(el=>el.classList.add('revealed'));}});
 let frame=0;const update=()=>{frame=0;document.body.classList.toggle('is-scrolled',scrollY>innerHeight-130);};addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});update();addEventListener('pagehide',finishText);
})();
