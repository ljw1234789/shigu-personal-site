(() => {
  'use strict';
  const root=document.documentElement, wave=document.getElementById('wave-canvas'), canvas=document.getElementById('work-canvas');
  const section=document.getElementById('projects'), stage=section?.querySelector('.work-stage');
  const cards=[...document.querySelectorAll('.case-card')], jumps=[...document.querySelectorAll('[data-work-step]')];
  if(!wave||!canvas||!stage||cards.length!==3)return;
  const wc=wave.getContext('2d'), ctx=canvas.getContext('2d');
  if(!wc||!ctx)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)), smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
  const segments=[[.12,.43],[.40,.72],[.69,1.15]];
  let ww=0,wh=0,w=0,h=0,top=0,travel=1,raf=0,last=0,dirty=true,waveVisible=true,workVisible=false,colorUntil=performance.now()+5200;
  const paused=()=>document.body.classList.contains('is-paused');
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,2);
    for(const [el,c] of [[wave,wc],[canvas,ctx]]){const r=el.getBoundingClientRect();el.width=Math.round(r.width*dpr);el.height=Math.round(r.height*dpr);c.setTransform(dpr,0,0,dpr,0,0);if(el===wave){ww=r.width;wh=r.height}else{w=r.width;h=r.height}}
    top=section.getBoundingClientRect().top+scrollY;travel=Math.max(1,section.offsetHeight-stage.offsetHeight);dirty=true;schedule();
  }
  function drawWave(){
    if(!ww||!wh)return;
    wc.clearRect(0,0,ww,wh);wc.strokeStyle=getComputedStyle(wave).color;wc.lineWidth=1;
    // Six fixed contours: no time input, pointer deformation or dense stripes.
    for(let i=0;i<6;i++){
      const y=(i+.5)*wh/6, bend=wh*.12;
      wc.beginPath();wc.moveTo(0,y);
      wc.bezierCurveTo(ww*.18,y-bend,ww*.32,y+bend,ww*.5,y);
      wc.bezierCurveTo(ww*.68,y-bend,ww*.82,y+bend,ww,y);
      wc.stroke();
    }
  }
  function drawWork(){
    if(!w||!h)return;
    const progress=clamp((scrollY-top)/travel), open=smooth(progress/.19);
    const stageStyle=getComputedStyle(stage), field=stageStyle.backgroundColor, ink=stageStyle.color, backdrop=getComputedStyle(canvas).backgroundColor;
    ctx.fillStyle=field;ctx.fillRect(0,0,w,h);ctx.strokeStyle=ink;ctx.globalAlpha=.14;ctx.lineWidth=.7;
    const grid=42;for(let x=0;x<w;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
    ctx.globalAlpha=1;
    const gw=(w<700?106:150)+(w-(w<700?106:150))*open, gh=h-116+116*open;
    ctx.save();ctx.beginPath();ctx.roundRect((w-gw)/2,(h-gh)/2,gw,gh,Math.max(0,90*(1-open)));ctx.clip();ctx.fillStyle=backdrop;ctx.fillRect(0,0,w,h);
    // The opening title leaves before a project enters; the image owns the stage.
    const fs=Math.min(h*.164,w*.22), chars=['视','频','作','品'];
    ctx.font=`900 ${fs}px "Arial Black","PingFang SC",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.globalAlpha=1-smooth(open/.72);ctx.fillStyle=ink;
    chars.forEach((letter,row)=>ctx.fillText(letter,w/2,h*(.20+row*.193)));
    ctx.restore();stage.classList.toggle('stage-open',open>.55);
    let active=-1;
    cards.forEach((card,i)=>{
      const [a,b]=segments[i], p=(progress-a)/(b-a), visible=p>0&&p<1;
      card.classList.toggle('is-current',visible);card.inert=!visible;card.setAttribute('aria-hidden',String(!visible));
      if(!visible)return;
      const enter=smooth(p/.22), leave=smooth((p-.76)/.24), y=(1-enter)*h*.60-leave*h*.60-12;
      const scale=.96+.04*enter;
      card.style.transform=`translate(-50%,-50%) translateY(${y}px) scale(${scale})`;
      card.style.opacity=clamp(p/.09)*clamp((1-p)/.1);
      if(p>.08&&p<.92)active=i;
    });
    jumps.forEach((button,i)=>button.setAttribute('aria-current',String(i===active)));
  }
  function frame(time){raf=0;if(document.hidden)return;
    const changingColor=time<colorUntil&&!reduced.matches;
    if(dirty||(changingColor&&time-last>32)){
      if(waveVisible)drawWave();if(workVisible&&!reduced.matches)drawWork();last=time;dirty=false;
    }
    if(changingColor&&(waveVisible||workVisible))schedule();
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(frame)}
  function mode(){root.classList.toggle('folio-enhanced',!reduced.matches);if(reduced.matches){cards.forEach(c=>{c.inert=false;c.removeAttribute('aria-hidden');c.removeAttribute('style')});stage.classList.remove('stage-open')}resize()}
  const visibility=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.target===wave)waveVisible=e.isIntersecting;else{workVisible=e.isIntersecting;document.body.classList.toggle('work-in-view',e.isIntersecting)}});dirty=true;schedule()});visibility.observe(wave);visibility.observe(stage);
  const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');reveal.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('[data-reveal],.homepage-tool').forEach(el=>reveal.observe(el));
  jumps.forEach((button,i)=>button.addEventListener('click',()=>{const [a,b]=segments[i];window.scrollTo({top:top+travel*(a+(b-a)*.48),behavior:paused()?'instant':'smooth'})}));
  addEventListener('scroll',()=>{dirty=true;schedule()},{passive:true});addEventListener('resize',resize);addEventListener('load',resize);
  new ResizeObserver(resize).observe(stage);new MutationObserver(()=>{colorUntil=performance.now()+5200;dirty=true;schedule()}).observe(root,{attributes:true,attributeFilter:['data-season']});new MutationObserver(()=>{dirty=true;schedule()}).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{dirty=true;schedule()});reduced.addEventListener('change',mode);addEventListener('pagehide',()=>cancelAnimationFrame(raf));addEventListener('pageshow',()=>{raf=0;resize()});mode();document.fonts.ready.then(resize);
})();
