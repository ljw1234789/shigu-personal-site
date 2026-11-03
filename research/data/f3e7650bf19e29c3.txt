'use strict';
(() => {
  const cover=document.getElementById('personEntry'), enter=document.getElementById('enterLab');
  if(!cover||!enter)return;
  const report=[document.querySelector('.top'),document.querySelector('main'),document.querySelector('.footer')].filter(Boolean);
  report.forEach(el=>el.inert=true);
  let entered=false;
  let reopening=false, returnScroll=0, returnFocus=null, leaveTimer=0;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const mouse=matchMedia('(hover: hover) and (pointer: fine)');
  const portrait=cover.querySelector('.entry-portrait');
  const portraitImage=cover.querySelector('.entry-portrait-image');
  const replay=document.getElementById('replayEntry'), loopButton=document.getElementById('toggleEntryLoop');
  let looping=!!loopButton&&!reducedMotion.matches, loopTimer=0, introCount=0;
  let introStarted=false, introTimer=0, settleTimer=0, pointerFrame=0, pointerPosition=null;
  function syncPlayback(){
    cover.classList.toggle('entry-motion-paused',!looping&&!!loopButton);
    cover.dataset.autoPlay=String(looping);
    if(replay)replay.disabled=reducedMotion.matches;
    if(loopButton){loopButton.disabled=reducedMotion.matches;loopButton.setAttribute('aria-label',looping?'暂停封面动效':'播放封面动效');loopButton.innerHTML=looping?'暂停 <span aria-hidden="true">Ⅱ</span>':'播放 <span aria-hidden="true">▷</span>'}
  }
  function scheduleLoop(){
    clearTimeout(loopTimer);loopTimer=0;
    if(looping&&!entered&&!cover.hidden&&!reducedMotion.matches&&document.visibilityState!=='hidden')loopTimer=setTimeout(()=>restartIntro(true),10000);
  }
  function restartIntro(fromLoop=false){
    if(entered||cover.hidden||reducedMotion.matches)return;
    clearTimeout(introTimer);clearTimeout(settleTimer);clearTimeout(loopTimer);resetDepth();
    cover.classList.remove('entry-arriving','entry-loop','entry-motion-paused');
    cover.classList.toggle('entry-loop',fromLoop);
    void cover.offsetWidth;introStarted=false;startIntro(true);
  }
  syncPlayback();
  replay?.addEventListener('click',()=>restartIntro());
  loopButton?.addEventListener('click',()=>{
    looping=!looping;syncPlayback();
    if(looping)restartIntro(true);else{clearTimeout(loopTimer);clearTimeout(settleTimer);cover.classList.remove('entry-arriving','entry-loop');resetDepth()}
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')clearTimeout(loopTimer);else scheduleLoop()});
  function startIntro(force=false){
    if(introStarted||entered)return;
    introStarted=true;clearTimeout(introTimer);
    if(reducedMotion.matches||loopButton&&!looping&&force!==true)return;
    cover.classList.remove('entry-motion-paused');
    cover.dataset.playCount=String(++introCount);
    cover.classList.add('entry-arriving');
    // Remove filled animations so the portrait can respond to the pointer afterwards.
    settleTimer=setTimeout(()=>{cover.classList.remove('entry-arriving','entry-loop');syncPlayback();scheduleLoop()},1650);
  }
  if(portraitImage){
    const preload=new Image();
    preload.onload=startIntro;preload.onerror=startIntro;
    preload.src=portraitImage.getAttribute('src');
    if(preload.complete)startIntro();
  }else startIntro();
  introTimer=setTimeout(startIntro,900);
  function resetDepth(){
    cancelAnimationFrame(pointerFrame);pointerFrame=0;pointerPosition=null;
    ['--entry-rx','--entry-ry','--entry-x','--entry-y','--entry-frame-x','--entry-frame-y'].forEach(name=>portrait.style.removeProperty(name));
  }
  function paintDepth(){
    pointerFrame=0;
    if(!pointerPosition||entered||cover.classList.contains('entry-motion-paused')||reducedMotion.matches||!mouse.matches)return;
    const bounds=portrait.getBoundingClientRect();
    const clamp=value=>Math.max(-1,Math.min(1,value));
    const x=clamp((pointerPosition.x-bounds.left-bounds.width/2)/(bounds.width/2));
    const y=clamp((pointerPosition.y-bounds.top-bounds.height/2)/(bounds.height/2));
    portrait.style.setProperty('--entry-rx',`${(-y*2.5).toFixed(2)}deg`);
    portrait.style.setProperty('--entry-ry',`${(x*4).toFixed(2)}deg`);
    portrait.style.setProperty('--entry-x',`${(x*16).toFixed(2)}px`);
    portrait.style.setProperty('--entry-y',`${(y*10).toFixed(2)}px`);
    portrait.style.setProperty('--entry-frame-x',`${(-x*8).toFixed(2)}px`);
    portrait.style.setProperty('--entry-frame-y',`${(-y*6).toFixed(2)}px`);
  }
  function followPointer(event){
    if(event.pointerType!=='mouse'||entered||cover.classList.contains('entry-motion-paused')||reducedMotion.matches||!mouse.matches)return;
    pointerPosition={x:event.clientX,y:event.clientY};
    if(!pointerFrame)pointerFrame=requestAnimationFrame(paintDepth);
  }
  cover.addEventListener('pointermove',followPointer,{passive:true});
  cover.addEventListener('pointerleave',resetDepth);
  reducedMotion.addEventListener('change',()=>{looping=false;clearTimeout(loopTimer);clearTimeout(settleTimer);resetDepth();cover.classList.remove('entry-arriving','entry-loop');syncPlayback()});
  mouse.addEventListener('change',resetDepth);
  function enterReport(){
    if(entered)return;entered=true;
    clearTimeout(introTimer);clearTimeout(settleTimer);clearTimeout(loopTimer);resetDepth();
    cover.classList.remove('entry-arriving','entry-loop');cover.classList.add('is-leaving','entry-motion-paused');
    document.body.classList.remove('entry-pending');
    report.forEach(el=>el.inert=false);
    if(!reopening)history.replaceState(history.state,'',location.pathname+location.search+'#top');
    window.scrollTo({top:reopening?returnScroll:0,behavior:'instant'});
    window.dispatchEvent(new Event('lab:entered'));
    const finish=()=>{
      cover.hidden=true;
      portrait.querySelector('.entry-portrait-motion').style.willChange='auto';
      const main=document.querySelector('main');
      main.setAttribute('tabindex','-1');
      const focusTarget=reopening&&returnFocus?.isConnected?returnFocus:main;
      focusTarget.focus({preventScroll:true});
      leaveTimer=0;
    };
    if(reducedMotion.matches)finish();
    else leaveTimer=setTimeout(finish,480);
  }
  enter.addEventListener('click',event=>{event.preventDefault();enterReport()});
  document.querySelectorAll('[data-open-cover]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();
    if(!entered)return;
    clearTimeout(leaveTimer);clearTimeout(introTimer);clearTimeout(settleTimer);resetDepth();
    returnScroll=window.scrollY;returnFocus=link;reopening=true;entered=false;
    cover.hidden=false;cover.scrollTop=0;
    cover.classList.remove('is-leaving','entry-arriving','entry-loop');syncPlayback();
    document.body.classList.add('entry-pending');
    report.forEach(el=>el.inert=true);
    portrait.querySelector('.entry-portrait-motion').style.willChange=mouse.matches?'transform':'auto';
    enter.firstChild.nodeValue='继续阅读 ';
    introStarted=false;startIntro();
    enter.focus({preventScroll:true});
  }));
  cover.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();enterReport()}
    if(event.key==='Tab'){
      const controls=[...cover.querySelectorAll('button:not([disabled]),a[href]')];
      const index=controls.indexOf(document.activeElement);
      const next=(index+(event.shiftKey?-1:1)+controls.length)%controls.length;
      event.preventDefault();controls[next].focus({preventScroll:true});
    }
  });
})();
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.section-head,.identity,.style-line,.criteria,.case,.flow,.op,.quiz-layout,.source-row,.experiment-copy,.illusion-board');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
  }, {threshold:.08,rootMargin:'0px 0px -24px 0px'});
  revealEls.forEach(el=>{el.classList.add('reveal');observer.observe(el)});

  // A small demonstration authored for this report. Both blue circles share the same radius.
  const board=document.getElementById('illusionBoard'), answer=document.getElementById('experimentAnswer');
  const guesses=[...document.querySelectorAll('[data-guess]')], reset=document.getElementById('resetExperiment');
  guesses.forEach(btn=>btn.addEventListener('click',()=>{
    guesses.forEach(b=>{b.disabled=true;b.setAttribute('aria-pressed',String(b===btn))});
    board.classList.add('revealed');
    answer.textContent=btn.dataset.guess==='same'?'答对了。两个蓝圆一样大。去掉周围的圆，再对齐比较，证据就在眼前。':'两个蓝圆其实一样大。去掉周围的圆，再对齐比较。猜错也没关系，验证比直觉更可靠。';
    document.getElementById('illusionCaption').textContent='一样大。你的眼睛刚才同意了吗？';reset.hidden=false;
  }));
  reset.addEventListener('click',()=>{board.classList.remove('revealed');guesses.forEach(b=>{b.disabled=false;b.setAttribute('aria-pressed','false')});answer.textContent='选一个答案，看看会发生什么。';document.getElementById('illusionCaption').textContent='先相信直觉。然后，我们验证一下。';reset.hidden=true});

  const nav=[...document.querySelectorAll('.nav a:not([data-open-cover])')], progress=document.querySelector('.reading-progress');
  const hero=document.querySelector('.hero-scroll'), stage=document.querySelector('.hero-stage');
  const canvas=document.getElementById('labCanvas'), ctx=canvas.getContext('2d');
  // Brief observation marks follow a mouse throughout the report without intercepting input.
  // A fixed, bounded layer keeps their coordinates aligned with the pointer after scrolling.
  const pointerTrail=document.createElement('div');
  pointerTrail.className='lab-pointer-trail';pointerTrail.setAttribute('aria-hidden','true');document.body.append(pointerTrail);
  let trailPoint=null,trailTime=0,trailSequence=0;
  const trailGlyphs=[
    '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="13" fill="none" stroke="currentColor" stroke-width="1"/><path d="M24 5v10m0 18v10M5 24h10m18 0h10" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="24" cy="24" r="2" fill="currentColor"/></svg>',
    '<svg viewBox="0 0 48 48"><path d="M11 32h27M14 32v-7m6 7v-11m6 11v-7m6 7v-11m6 11v-7" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="16" cy="14" r="4.5" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="30" cy="11" r="2.5" fill="currentColor" opacity=".5"/></svg>'
  ];
  function clearLabTrail(){pointerTrail.replaceChildren();trailPoint=null}
  function leaveTrail(event){
    if(reduced||event.pointerType!=='mouse')return;
    const x=event.clientX,y=event.clientY,now=performance.now();
    if(now-trailTime<45||trailPoint&&Math.hypot(x-trailPoint.x,y-trailPoint.y)<26)return;
    const tilt=trailPoint?Math.atan2(y-trailPoint.y,x-trailPoint.x)*180/Math.PI*.12:0;
    trailPoint={x,y};trailTime=now;
    const mark=document.createElement('span');mark.className='lab-observation-mark';mark.innerHTML=trailGlyphs[trailSequence++%2];
    mark.style.left=`${x}px`;mark.style.top=`${y}px`;pointerTrail.append(mark);
    while(pointerTrail.childElementCount>12)pointerTrail.firstElementChild.remove();
    const animation=mark.animate([
      {opacity:0,transform:`translate(-50%,-50%) rotate(${tilt-8}deg) scale(.65)`},
      {opacity:.58,transform:`translate(-50%,-50%) rotate(${tilt}deg) scale(1)`,offset:.16},
      {opacity:0,transform:`translate(-50%,-57%) rotate(${tilt+5}deg) scale(.94)`}
    ],{duration:1050,easing:'cubic-bezier(.2,.65,.3,1)',fill:'forwards'});
    animation.finished.then(()=>mark.remove()).catch(()=>mark.remove());
  }
  let w=0,h=0,dpr=1,mouseX=0,mouseY=0,lookX=0,lookY=0,turn=0,angle=0,heroProgress=0,visible=!document.body.classList.contains('entry-pending'),frame=0,last=0,startTime=null;
  const stages=[['01 / 好奇','小问题，值得认真。'],['02 / 提问','先让观众猜一猜。'],['03 / 验证','让证据进入画面。'],['04 / 解释','有趣之后，讲明白。']];let stageIndex=-1;
  const panels=[...document.querySelectorAll('.story-panel')], sceneButtons=[...document.querySelectorAll('[data-scene]')];
  function setScene(idx){
    if(idx===stageIndex)return;stageIndex=idx;
    panels.forEach((panel,i)=>{panel.classList.toggle('is-active',i===idx);panel.setAttribute('aria-hidden',String(i!==idx));panel.inert=i!==idx});
    sceneButtons.filter(b=>b.closest('.story-steps')).forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.scene===idx)));
    document.getElementById('signalIndex').textContent=stages[idx][0];document.getElementById('signalText').textContent=stages[idx][1];
    stage.dataset.scene=idx;
  }
  sceneButtons.forEach(btn=>btn.addEventListener('click',()=>{
    const idx=+btn.dataset.scene;
    if(reduced){setScene(idx);heroProgress=idx/4;draw(0);return}
    const r=hero.getBoundingClientRect(),top=parseFloat(getComputedStyle(stage).top)||0;
    window.scrollTo({top:Math.max(0,scrollY+r.top-top+(r.height-h)*(idx/4+.025)),behavior:'smooth'});
  }));
  const clamp=n=>Math.max(0,Math.min(1,n)), lerp=(a,b,t)=>a+(b-a)*t;
  function camera(p){
    const keys=[{x:.65,y:.43,s:1,ax:-.20,ay:0,az:-.23},{x:.29,y:.43,s:1.18,ax:-.06,ay:.8,az:.04},{x:.70,y:.47,s:1.03,ax:.27,ay:1.72,az:-.10},{x:.29,y:.48,s:.94,ax:.08,ay:2.55,az:.07}];
    const pos=Math.min(3,p*4),idx=Math.min(2,Math.floor(pos)),phase=pos-idx,t=clamp((phase-.68)/.32),e=t*t*(3-2*t),a=keys[idx],b=keys[idx+1];
    return Object.fromEntries(Object.keys(a).map(k=>[k,lerp(a[k],b[k],e)]));
  }
  function resize(){const r=stage.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,1.6);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);scroll();draw(0)}
  function scroll(){
    clearLabTrail();
    const r=hero.getBoundingClientRect(),top=parseFloat(getComputedStyle(stage).top)||0;
    if(!reduced)heroProgress=clamp((top-r.top)/Math.max(1,r.height-h));
    stage.style.setProperty('--hero-progress',heroProgress.toFixed(3));
    if(!reduced||stageIndex<0)setScene(Math.min(3,Math.floor(heroProgress*4)));
    const phase=(heroProgress*4)%1,panelOpacity=reduced?1:Math.min(stageIndex===0?1:clamp(phase/.09),stageIndex===3?1:clamp((.83-phase)/.15));
    stage.style.setProperty('--panel-opacity',panelOpacity.toFixed(3));
    stage.style.setProperty('--guide-opacity',Math.max(0,1-Math.abs(heroProgress-.55)*5).toFixed(3));
    updateCase();
    progress.style.transform=`scaleX(${scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)})`;
    const readingLine=document.querySelector('.top').getBoundingClientRect().bottom+24;
    let active='';for(const a of nav){const el=document.querySelector(a.getAttribute('href'));if(el.getBoundingClientRect().top<=readingLine)active=a.getAttribute('href')}
    nav.forEach(a=>{const current=a.getAttribute('href')===active;a.classList.toggle('active',current);if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
    if(reduced)draw(0);
  }
  stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=stage.getBoundingClientRect();mouseX=(e.clientX-r.left)/r.width-.5;mouseY=(e.clientY-r.top)/r.height-.5;});
  stage.addEventListener('pointerleave',()=>{mouseX=0;mouseY=0});
  document.addEventListener('pointermove',leaveTrail,{passive:true});
  document.addEventListener('pointerleave',clearLabTrail);
  document.addEventListener('pointercancel',clearLabTrail);
  addEventListener('blur',clearLabTrail);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearLabTrail()});
  document.getElementById('angleButton').addEventListener('click',()=>{turn+=Math.PI*.72;if(reduced){angle=turn;draw(0)}});
  new IntersectionObserver(([e])=>{visible=e.isIntersecting&&!document.body.classList.contains('entry-pending');if(visible&&!frame&&!reduced)frame=requestAnimationFrame(tick)}, {rootMargin:'80px'}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else if(visible&&!reduced){frame=requestAnimationFrame(tick)}});
  addEventListener('scroll',scroll,{passive:true});addEventListener('resize',resize,{passive:true});

  // Draw a perspective-projected glass cylinder, fluid and graduations without external models.
  // Only the visible hero renders; the canvas stops when the page is hidden or off screen.
  function draw(time){
    if(!ctx||!w||!h)return;ctx.clearRect(0,0,w,h);
    const mobile=w<650,c= camera(heroProgress);
    const scale=mobile?Math.min(w/540,h/890)*(.91+(c.s-1)*.35):Math.min(w/1160,h/640)*c.s;
    const centerX=mobile?w*(.50+(c.x-.5)*.18):w*c.x,centerY=mobile?h*.29:h*c.y;
    const ay=angle+c.ay+lookX*.16,ax=c.ax+lookY*.09,az=mobile?c.az*.55:c.az;
    const float=reduced?0:Math.sin(time*.0006)*2.5;
    function proj(x,y,z){
      const xx=x*Math.cos(ay)+z*Math.sin(ay),zz=-x*Math.sin(ay)+z*Math.cos(ay);
      const yy=y*Math.cos(ax)-zz*Math.sin(ax),z2=y*Math.sin(ax)+zz*Math.cos(ax);
      const x2=xx*Math.cos(az)-yy*Math.sin(az),y2=xx*Math.sin(az)+yy*Math.cos(az),p=760/(760-z2);
      return [centerX+x2*p*scale,centerY+(y2*p+float)*scale];
    }
    function path(points,fill,stroke,width=1){ctx.beginPath();points.forEach((p,i)=>{const v=proj(...p);i?ctx.lineTo(...v):ctx.moveTo(...v)});if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
    function ring(y,r=69){const arr=[];for(let i=0;i<=72;i++){let t=i/72*Math.PI*2;arr.push([Math.cos(t)*r,y,Math.sin(t)*r])}return arr}
    // Soft cast shadow on the laboratory surface.
    ctx.save();ctx.translate(centerX,centerY+scale*232);ctx.scale(scale,scale*.17);const shadow=ctx.createRadialGradient(0,0,5,0,0,155);shadow.addColorStop(0,'rgba(31,75,105,.14)');shadow.addColorStop(1,'rgba(31,75,105,0)');ctx.fillStyle=shadow;ctx.fillRect(-190,-150,380,300);ctx.restore();
    path(ring(204,103),'rgba(209,224,235,.24)','rgba(112,146,167,.2)',1.2);
    // Back glass wall, shaded strips create a glass-like reflective volume.
    for(let i=0;i<48;i++){const a=i/48*Math.PI*2,b=(i+1)/48*Math.PI*2;const light=Math.pow(Math.max(0,Math.cos(a+ay-.6)),10);path([[69*Math.cos(a),-205,69*Math.sin(a)],[69*Math.cos(b),-205,69*Math.sin(b)],[69*Math.cos(b),190,69*Math.sin(b)],[69*Math.cos(a),190,69*Math.sin(a)]],`rgba(255,255,255,${.06+light*.26})`,null)}
    // Blue fluid. The water surface stays level as the viewpoint changes.
    let surface=-8+(reduced?0:Math.sin(time*.0012)*1.8);
    const front=[];for(let i=0;i<=40;i++){let t=i/40*Math.PI+ay;front.push([65*Math.cos(t),surface,65*Math.sin(t)])}for(let i=40;i>=0;i--){let t=i/40*Math.PI+ay;front.push([65*Math.cos(t),184,65*Math.sin(t)])}
    let fluidGradient=ctx.createLinearGradient(0,centerY-30*scale,0,centerY+200*scale);fluidGradient.addColorStop(0,'rgba(64,139,245,.32)');fluidGradient.addColorStop(.65,'rgba(43,110,234,.53)');fluidGradient.addColorStop(1,'rgba(15,77,158,.24)');path(front,fluidGradient,'rgba(76,139,211,.25)');
    path(ring(surface,65),'rgba(115,179,253,.43)','rgba(62,134,225,.4)',1.2);
    path(ring(185,65),'rgba(84,156,234,.14)','rgba(91,156,225,.22)');
    path([[69,-205,0],[69,190,0]],null,'rgba(147,176,197,.5)',1.4);path([[-69,-205,0],[-69,190,0]],null,'rgba(147,176,197,.5)',1.4);
    path(ring(-205,69),null,'rgba(96,133,163,.55)',1.5);path(ring(-210,73),null,'rgba(255,255,255,.9)',2.3);path(ring(190,69),null,'rgba(129,158,180,.5)',1.3);
    // Fine graduated marks turn with the cylinder, not with the page.
    for(let i=0;i<=20;i++){const y=160-i*17;let a=.5+ay*.05;const major=i%5===0,pts=[];for(let j=0;j<=5;j++){let t=a+j/5*(major?.5:.25);pts.push([70*Math.cos(t),y,70*Math.sin(t)])}path(pts,null,major?'rgba(52,83,110,.58)':'rgba(88,119,143,.43)',major?1.5:1);
      if(major){const p=proj(83*Math.cos(a),y,83*Math.sin(a));ctx.font=`${10*scale}px "IBM Plex Mono",monospace`;ctx.fillStyle='rgba(55,94,124,.68)';ctx.fillText(String(i*5),p[0]+8*scale,p[1]+3*scale);}}
    const p=proj(-35,-150,62);ctx.font=`${10*scale}px "IBM Plex Mono",monospace`;ctx.fillStyle='rgba(81,123,153,.5)';ctx.fillText('100 mL',p[0],p[1]);
    // Single vertical highlight gives a crisp instrument edge.
    path([[-53,-194,44],[-53,181,44]],null,'rgba(255,255,255,.82)',2.8);
    path(ring(200,103),null,'rgba(255,255,255,.82)',1.8);
    // Floor measurement guides appear as the scroll moves toward verification.
    if(heroProgress>.1){ctx.globalAlpha=Math.min(.5,heroProgress*.6);const y=centerY+scale*248;ctx.beginPath();ctx.moveTo(centerX-145*scale,y);ctx.lineTo(centerX+145*scale,y);ctx.strokeStyle='#9eb5c7';ctx.lineWidth=.7;ctx.stroke();for(let i=-5;i<=5;i++){ctx.beginPath();ctx.moveTo(centerX+i*26*scale,y);ctx.lineTo(centerX+i*26*scale,y+(i%5===0?9:5)*scale);ctx.stroke()}ctx.globalAlpha=1;}
  }
  function tick(t){frame=0;if(!visible||document.hidden)return;if(startTime===null)startTime=t;if(t-last>32){last=t;lookX+=(mouseX-lookX)*.065;lookY+=(mouseY-lookY)*.065;angle+=(turn+Math.sin((t-startTime)*.00023)*.10-angle)*.05;draw(t-startTime);}frame=requestAnimationFrame(tick)}
  // Case actions change both the illustration and its nearby explanation.
  const caseStory=document.querySelector('.case-story'),cases=[...document.querySelectorAll('.story-case')],objects=[...document.querySelectorAll('.case-object')];
  const caseNames=['01 / 量筒读数','02 / 盘子上的X','03 / 不用打气的足球'];let caseIndex=-1;
  const caseVisual=document.querySelector('.case-visual'),objectAction=document.getElementById('caseObjectAction'),actionHint=document.getElementById('caseActionHint');
  const actionLabels=['点击量筒倒水','点击盘子查看纹路','点击足球查看观众追问'];
  const actionHints=['点量筒，倒出看看 ↗','点盘子，看近一点 ＋','点足球，看看追问 ↗'];
  function showCase(index){
    caseIndex=index;
    objects.forEach((obj,i)=>obj.classList.toggle('is-active',i===index));
    document.getElementById('caseVisualName').textContent=caseNames[index];
    objectAction.setAttribute('aria-label',actionLabels[index]);
    actionHint.textContent=index===0&&objects[0].classList.contains('is-poured')?'再点一次，重新装水 ↻':index===1&&objects[1].classList.contains('is-closeup')?'再点一次，回到整体 −':index===2&&objects[2].classList.contains('has-comment')?'再点一次，收起追问 ↶':actionHints[index];
  }
  // Only the on-screen object moves. The reader can pause it without losing the interactions.
  let caseVisible=false,motionPaused=false;
  const motionToggle=document.getElementById('caseMotionToggle');
  motionToggle.hidden=reduced;
  function syncCaseMotion(){caseVisual.classList.toggle('motion-running',caseVisible&&!document.hidden&&!motionPaused&&!reduced)}
  new IntersectionObserver(([entry])=>{caseVisible=entry.isIntersecting;syncCaseMotion()},{threshold:.12}).observe(caseVisual);
  document.addEventListener('visibilitychange',syncCaseMotion);
  motionToggle.addEventListener('click',()=>{
    motionPaused=!motionPaused;syncCaseMotion();
    motionToggle.setAttribute('aria-pressed',String(motionPaused));motionToggle.setAttribute('aria-label',motionPaused?'继续图形动效':'暂停图形动效');
    motionToggle.innerHTML=motionPaused?'继续动效 <span aria-hidden="true">▷</span>':'暂停动效 <span aria-hidden="true">Ⅱ</span>';
  });
  function updateCase(){
    if(!caseStory)return;const r=caseStory.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
    const focus=innerWidth<=680?caseVisual.getBoundingClientRect().bottom+40:innerHeight*.48;let best=0;
    cases.forEach((el,i)=>{if(el.getBoundingClientRect().top<=focus)best=i});
    if(best!==caseIndex)showCase(best);
    const b=cases[best].getBoundingClientRect(),p=clamp((innerHeight-b.top)/(innerHeight+b.height));
    caseStory.style.setProperty('--case-turn',`${reduced?0:(p-.5)*10}deg`);
  }
  const cylinder=objects[0],pourButton=document.getElementById('pourButton'),pourFeedback=document.getElementById('pourFeedback');
  const calibrationButtons=[...document.querySelectorAll('[data-calibration]')];
  let calibration='In',poured=false,pourAnimation;
  function renderCylinder(){
    cylinder.classList.toggle('is-poured',poured);
    document.getElementById('cylinderMark').textContent=calibration;
    document.getElementById('containedVolume').textContent=poured?'留下少量挂壁水':calibration==='In'?'筒内 100mL':'筒内 >100mL';
    document.getElementById('deliveredVolume').textContent=poured?(calibration==='In'?'倒出 <100mL':'倒出 100mL'):'烧杯里会有多少？';
    calibrationButtons.forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.calibration===calibration)));
    pourButton.innerHTML=poured?'再装一次 <span aria-hidden="true">↻</span>':'倒出看看 <span aria-hidden="true">↗</span>';
    pourFeedback.textContent=poured?(calibration==='In'?'少了一点。In标定的是筒内体积；倒出后，部分水留在筒壁上，所以交付量少于100mL。':'这次按规定倒出的是100mL。Ex标定的是交付体积，已经把挂壁残留考虑进去；原本筒内的水会略多。'):(calibration==='In'?'先看量入式：刻度对应筒内的水量。你觉得倒出后会怎样？':'换成量出式：刻度对应按规定倒出的水量。再倒一次，比较结果。');
    showCase(0);
  }
  calibrationButtons.forEach(btn=>btn.addEventListener('click',()=>{
    if(pourAnimation)pourAnimation.cancel();
    calibration=btn.dataset.calibration;poured=false;showCase(0);renderCylinder();
  }));
  pourButton.addEventListener('click',()=>{
    if(pourAnimation)pourAnimation.cancel();
    poured=!poured;showCase(0);renderCylinder();
    if(poured&&!reduced){
      pourAnimation=document.getElementById('pourCylinder').animate([{transform:'rotate(0deg)'},{transform:'rotate(60deg)',offset:.38},{transform:'rotate(60deg)',offset:.70},{transform:'rotate(0deg)'}],{duration:950,easing:'ease-in-out'});
      document.getElementById('pourStream').animate([{opacity:0},{opacity:.8,offset:.32},{opacity:.8,offset:.68},{opacity:0}],{duration:950});
    }
  });
  const plateButton=document.getElementById('plateDetailButton');
  plateButton.addEventListener('click',()=>{
    const closeup=plateButton.getAttribute('aria-pressed')!=='true';showCase(1);
    plateButton.setAttribute('aria-pressed',String(closeup));objects[1].classList.toggle('is-closeup',closeup);
    plateButton.innerHTML=closeup?'回到整体 <span aria-hidden="true">−</span>':'看近一点 <span aria-hidden="true">＋</span>';
    document.getElementById('plateFeedback').textContent=closeup?'原视频放大后，盘面可见细微的同心圆划痕。先找到被忽略的细节，再继续追问X怎样形成。这里展示纹路，完整解释回到原作品。':'先看整体，再点开表面细节。熟悉的物件，也值得多看一眼。';
    showCase(1);
  });
  const commentButton=document.getElementById('commentButton');
  commentButton.addEventListener('click',()=>{
    const open=commentButton.getAttribute('aria-pressed')!=='true';showCase(2);
    commentButton.setAttribute('aria-pressed',String(open));objects[2].classList.toggle('has-comment',open);
    commentButton.innerHTML=open?'回到选题 <span aria-hidden="true">↶</span>':'看看追问 <span aria-hidden="true">↗</span>';
    document.getElementById('commentFeedback').textContent=open?'多个可见评论继续追问以前的“水盆波纹为什么是方的”。观众把旧疑问带到新作品，留下了跨作品记忆的线索。它不能单独证明所有粉丝的粘性。':'先看这条视频，再看看观众把话题带去了哪里。';
    showCase(2);
  });
  objectAction.addEventListener('click',()=>{
    if(caseIndex===0)pourButton.click();else if(caseIndex===1)plateButton.click();else commentButton.click();
  });
  const flow=document.querySelector('.flow');new IntersectionObserver(([entry],obs)=>{if(entry.isIntersecting){flow.classList.add('flow-ready');obs.disconnect()}},{threshold:.2}).observe(flow);
  if(!reduced)new MutationObserver(()=>{
    document.getElementById('quizQuestion').animate([{opacity:.35,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
  }).observe(document.getElementById('quizQuestion'),{childList:true});
  addEventListener('lab:entered',()=>{const r=stage.getBoundingClientRect();visible=r.bottom>0&&r.top<innerHeight;resize();if(visible&&!reduced&&!frame)frame=requestAnimationFrame(tick)});
  resize();if(!reduced&&!frame&&visible)frame=requestAnimationFrame(tick);
})();

// A concrete assistant workflow; all samples remain readable without generated answers.
(() => {
  const tabs=[...document.querySelectorAll('[data-work-tab]')];
  const panels=[...document.querySelectorAll('.work-panel')];
  const next=document.getElementById('workNext'), count=document.getElementById('workStepCount');
  if(!tabs.length||!next)return;
  const labels=['拆问题','做验证','讲清楚','交给团队'];
  let selected=0;
  function show(index,focus=false){
    selected=(index+tabs.length)%tabs.length;
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===selected));tab.tabIndex=i===selected?0:-1});
    panels.forEach((panel,i)=>{panel.hidden=i!==selected;panel.classList.remove('is-switching')});
    const active=panels[selected];
    void active.offsetWidth;
    active.classList.add('is-switching');
    count.textContent=`0${selected+1} / 04 · ${labels[selected]}`;
    next.innerHTML=(selected===3?'重新看：拆问题':'下一步：'+labels[selected+1])+' <span aria-hidden="true">→</span>';
    if(focus)tabs[selected].focus();
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>show(i));
    tab.addEventListener('keydown',event=>{
      const offsets={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1};
      if(event.key in offsets){event.preventDefault();show(selected+offsets[event.key],true)}
      else if(event.key==='Home'||event.key==='End'){event.preventDefault();show(event.key==='Home'?0:tabs.length-1,true)}
    });
  });
  next.addEventListener('click',()=>show(selected+1));
  document.querySelectorAll('[data-copy-prompt]').forEach(button=>button.addEventListener('click',async()=>{
    const text=document.getElementById(button.dataset.copyPrompt)?.textContent;
    try{await navigator.clipboard.writeText(text);button.textContent='已复制 ✓'}
    catch{button.textContent='请选中上方指令复制'}
  }));
})();
