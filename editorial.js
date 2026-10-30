(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),root=document.documentElement;
 const reveal=[...document.querySelectorAll('[data-reveal],.case-card')];
 const targets=[...document.querySelectorAll('[data-resolve],.hero-topline p,.page-header .desktop-brand,.page-header .page-nav a')];
 const originals=new Map(targets.map(el=>[el,{html:el.innerHTML,text:el.textContent}])),timers=new Map();
 const paused=()=>reduced.matches||document.body.classList.contains('is-paused');
 const introReady=()=>!root.classList.contains('intro-pending')||root.classList.contains('intro-text-ready');
 function finishText(){timers.forEach(clearInterval);timers.clear();originals.forEach((value,el)=>{el.innerHTML=value.html})}
 function resolve(el){
  if(el.dataset.resolved)return;el.dataset.resolved='true';if(paused())return;
  const hero=el.parentElement.matches('.hero-statement,.closing-copy'),meta=el.closest('.hero-topline,.page-header');
  const lineIndex=hero?[...el.parentElement.children].indexOf(el):0,delay=hero?300+lineIndex*200:meta?300:0;let step=meta?10:80;
  const glyphs='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*+-=?/<>[]{}',spans=[];
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label',originals.get(el).text);
  for(const node of nodes){const fragment=document.createDocumentFragment();for(const char of node.textContent){const span=document.createElement('span');span.textContent=char;span.className='resolve-char';span.setAttribute('aria-hidden','true');fragment.appendChild(span);spans.push({span,char})}node.replaceWith(fragment)}
  if(hero)step=[800,1280,1440][lineIndex]/(spans.length+3);const settle=step*4;
  spans.forEach(({span})=>{const width=span.getBoundingClientRect().width;span.style.width=width+'px';span.style.visibility='hidden'});
  const start=performance.now(),id=setInterval(()=>{const t=performance.now()-start-delay;spans.forEach(({span,char},i)=>{const age=t-i*step;span.style.visibility=age>=0?'visible':'hidden';const changing=age>=0&&age<settle&&char.trim();span.textContent=changing?glyphs[(Math.floor(t/40)*7+i*11)%glyphs.length]:char;span.style.color=changing?(age<settle/2?'#c0fe04':'#607f02'):''});if(t>spans.length*step+settle){clearInterval(id);timers.delete(el);el.innerHTML=originals.get(el).html}},40);timers.set(el,id);
 }
 const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');revealObserver.unobserve(e.target)}}),{threshold:.1});if(!reduced.matches)root.classList.add('craft-motion');reveal.forEach(el=>revealObserver.observe(el));
 const resolveVisible=()=>{if(introReady())targets.forEach(el=>{const r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)resolve(el)})};
 const textObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting&&introReady())resolve(e.target)}),{threshold:.1});targets.forEach(el=>textObserver.observe(el));
 document.addEventListener('portfolio:intro-text',resolveVisible);new MutationObserver(resolveVisible).observe(root,{attributes:true,attributeFilter:['class']});
 new MutationObserver(()=>{if(paused())finishText()}).observe(document.body,{attributes:true,attributeFilter:['class']});reduced.addEventListener('change',()=>{if(reduced.matches){finishText();root.classList.remove('craft-motion');reveal.forEach(el=>el.classList.add('revealed'))}});
 let frame=0;const update=()=>{frame=0;document.body.classList.toggle('is-scrolled',scrollY>innerHeight-130)};addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update)},{passive:true});update();addEventListener('pagehide',finishText);
})();
