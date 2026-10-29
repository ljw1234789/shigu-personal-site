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
  let ww=0,wh=0,w=0,h=0,top=0,travel=1,raf=0,last=0,dirty=true,waveVisible=true,workVisible=false,px=.5,py=.5,now=0;
  const paused=()=>document.body.classList.contains('is-paused');
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,2);
    for(const [el,c] of [[wave,wc],[canvas,ctx]]){const r=el.getBoundingClientRect();el.width=Math.round(r.width*dpr);el.height=Math.round(r.height*dpr);c.setTransform(dpr,0,0,dpr,0,0);if(el===wave){ww=r.width;wh=r.height}else{w=r.width;h=r.height}}
    top=section.getBoundingClientRect().top+scrollY;travel=Math.max(1,section.offsetHeight-stage.offsetHeight);dirty=true;schedule();
  }
  function drawWave(t){
    if(!ww||!wh)return;wc.clearRect(0,0,ww,wh);wc.strokeStyle=getComputedStyle(wave).color;wc.lineWidth=1;
    const count=Math.min(145,Math.round(ww/7));
    for(let i=-3;i<count+3;i++){
      const base=i*ww/count;wc.beginPath();
      for(let j=0;j<=28;j++){
        const y=j/28*wh;const u=y/wh;
        const a=Math.sin(u*Math.PI)*Math.sin(base/ww*7+t*.32)*ww*.042;
        const b=Math.sin(u*Math.PI*3+t*.45+base/ww*3)*Math.sin(u*Math.PI)*ww*.022;
        const pointer=Math.exp(-Math.pow((base/ww-px)*4,2)-Math.pow((u-py)*3,2))*ww*.025;
        const x=base+a+b+pointer;if(j===0)wc.moveTo(x,y);else wc.lineTo(x,y);
      }wc.stroke();
    }
  }
  function drawWork(t){
    if(!w||!h)return;
    const progress=clamp((scrollY-top)/travel), open=smooth(progress/.19);
    const field=getComputedStyle(stage).backgroundColor, ink='#111512';
    ctx.fillStyle=field;ctx.fillRect(0,0,w,h);ctx.strokeStyle='#171a1855';ctx.lineWidth=.7;
    const grid=42;for(let x=0;x<w;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
    const gw=(w<700?106:150)+(w-(w<700?106:150))*open, gh=h-116+116*open;
    ctx.save();ctx.beginPath();ctx.roundRect((w-gw)/2,(h-gh)/2,gw,gh,Math.max(0,90*(1-open)));ctx.clip();ctx.fillStyle=ink;ctx.fillRect(0,0,w,h);
    // The opening title leaves before a project enters; the image owns the stage.
    const fs=Math.min(h*.164,w*.22), chars=['视','频','作','品'];
    ctx.font=`900 ${fs}px "Arial Black","PingFang SC",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.globalAlpha=1-smooth(open/.72);ctx.fillStyle=field;
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
  function frame(time){raf=0;if(document.hidden)return;const animated=!paused()&&!reduced.matches;
    if(dirty||(animated&&time-last>32)){if(animated)now=time*.001;if(waveVisible)drawWave(now);if(workVisible&&!reduced.matches)drawWork(now);last=time;dirty=false}
    if(animated&&(waveVisible||workVisible))schedule();
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(frame)}
  function mode(){root.classList.toggle('folio-enhanced',!reduced.matches);if(reduced.matches){cards.forEach(c=>{c.inert=false;c.removeAttribute('aria-hidden');c.removeAttribute('style')});stage.classList.remove('stage-open')}resize()}
  const visibility=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.target===wave)waveVisible=e.isIntersecting;else{workVisible=e.isIntersecting;document.body.classList.toggle('work-in-view',e.isIntersecting)}});dirty=true;schedule()});visibility.observe(wave);visibility.observe(stage);
  const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');reveal.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('[data-reveal],.homepage-tool').forEach(el=>reveal.observe(el));
  jumps.forEach((button,i)=>button.addEventListener('click',()=>{const [a,b]=segments[i];window.scrollTo({top:top+travel*(a+(b-a)*.48),behavior:paused()?'instant':'smooth'})}));
  wave.addEventListener('pointermove',e=>{const r=wave.getBoundingClientRect();px=clamp((e.clientX-r.left)/r.width);py=clamp((e.clientY-r.top)/r.height);dirty=true;schedule()});
  addEventListener('scroll',()=>{dirty=true;schedule()},{passive:true});addEventListener('resize',resize);addEventListener('load',resize);
  new ResizeObserver(resize).observe(stage);new MutationObserver(()=>{dirty=true;schedule()}).observe(root,{attributes:true,attributeFilter:['data-season']});new MutationObserver(()=>{dirty=true;schedule()}).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{dirty=true;schedule()});reduced.addEventListener('change',mode);addEventListener('pagehide',()=>cancelAnimationFrame(raf));addEventListener('pageshow',()=>{raf=0;resize()});mode();document.fonts.ready.then(resize);
})();
