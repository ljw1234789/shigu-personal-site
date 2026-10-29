(() => {
 const root=document.documentElement,curtain=document.getElementById('site-entrance');
 if(!curtain)return;if(!root.classList.contains('intro-pending')){curtain.remove();return}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),surfaces=[...document.querySelectorAll('.desktop-bar,[data-intro-surface]')],canvas=document.getElementById('entrance-dots'),ctx=canvas?.getContext('2d'),line=curtain.querySelector('.entrance-progress');
 let finished=false,raf=0,revealAt=0,textStarted=false,fontsReady=!document.fonts,progress=0;const start=performance.now();
 document.fonts?.ready.then(()=>{fontsReady=true});surfaces.forEach(el=>{el.inert=true;el.setAttribute('data-intro-inert','')});
 function startText(){if(textStarted)return;textStarted=true;root.classList.add('intro-text-ready');document.dispatchEvent(new Event('portfolio:intro-text'))}
 function finish(){if(finished)return;finished=true;cancelAnimationFrame(raf);startText();surfaces.forEach(el=>{el.inert=false;el.removeAttribute('data-intro-inert')});root.classList.remove('intro-pending','intro-running');curtain.remove();document.removeEventListener('keydown',key);reduced.removeEventListener('change',finish);removeEventListener('resize',resize)}
 function key(e){if(e.key==='Escape'){e.preventDefault();finish()}}
 function resize(){const dpr=Math.min(devicePixelRatio,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
 // Measured reveal curve: cubic-bezier(.66,0,.01,1).
 function easing(x){let low=0,high=1,t=x;for(let i=0;i<15;i++){const at=3*.66*t*(1-t)**2+3*.01*t*t*(1-t)+t**3;if(at<x)low=t;else high=t;t=(low+high)/2}return smooth(t)}
 function draw(now){
  if(finished)return;const elapsed=now-start,state=document.getElementById('name-stage')?.dataset.renderState,stageReady=state==='ready'||state==='fallback';
  const target=(fontsReady?.5:0)+(stageReady?.5:.4*Math.min(elapsed/6000,1));progress+=(target-progress)*.12;line.style.transform=`scaleX(${Math.max(.03,progress)})`;
  // Wait for the actual lettering, with a bounded failure escape.
  if(!revealAt&&elapsed>=2200&&((fontsReady&&stageReady)||elapsed>=12000)){revealAt=now;curtain.classList.add('dissolving')}
  if(revealAt){const age=now-revealAt;if(age>=100)startText();if(age>=250)curtain.classList.add('line-fading');
   const t=Math.min(1,age/800),open=easing(t),w=innerWidth,h=innerHeight,unit=Math.min(w,h),radius=Math.hypot(w/unit,h/unit)*open,feather=Math.max(.8,radius*.12),fill=smooth(((1-open)-.92)/.08),cell=16;
   ctx.clearRect(0,0,w,h);ctx.fillStyle='#efede7';ctx.beginPath();
   // Opaque paper dots shrink; no circular-hole wipe.
   for(let y=cell/2;y<h+cell;y+=cell)for(let x=cell/2;x<w+cell;x+=cell){const d=Math.hypot((x-w/2)*2/unit,(y-h/2)*2/unit),alpha=smooth((d-radius)/feather)*(1-fill)+fill,r=cell*.8*alpha;if(r>.01){ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,Math.PI*2)}}ctx.fill();if(t>=1){finish();return}
  }raf=requestAnimationFrame(draw)
 }
 curtain.querySelector('button').addEventListener('click',finish);document.addEventListener('keydown',key);reduced.addEventListener('change',finish);addEventListener('pagehide',finish,{once:true});addEventListener('resize',resize);root.classList.add('intro-running');if(reduced.matches||!ctx)finish();else{resize();raf=requestAnimationFrame(draw)}setTimeout(finish,14000);
})();
