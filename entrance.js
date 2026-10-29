(() => {
 const root=document.documentElement,curtain=document.getElementById('site-entrance');if(!curtain)return;if(!root.classList.contains('intro-pending')){curtain.remove();return}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),surfaces=[...document.querySelectorAll('.desktop-bar,[data-intro-surface]')],canvas=document.getElementById('entrance-dots'),ctx=canvas?.getContext('2d');let finished=false,raf=0,opened=0;const start=performance.now();
 surfaces.forEach(el=>{el.inert=true;el.setAttribute('data-intro-inert','')});
 const finish=()=>{if(finished)return;finished=true;cancelAnimationFrame(raf);surfaces.forEach(el=>{el.inert=false;el.removeAttribute('data-intro-inert')});root.classList.remove('intro-pending','intro-running');if(!reduced.matches){root.classList.add('intro-labels');setTimeout(()=>root.classList.remove('intro-labels'),1100);}curtain.remove();try{sessionStorage.setItem('ljw-intro-refined-20261030-2','seen')}catch{}document.removeEventListener('keydown',key);reduced.removeEventListener('change',finish);removeEventListener('resize',resize)};
 const key=e=>{if(e.key==='Escape'){e.preventDefault();finish()}};const resize=()=>{if(canvas){canvas.width=innerWidth;canvas.height=innerHeight}};
 function draw(now){if(finished)return;const elapsed=now-start;
  if(!opened&&elapsed>=2250&&(document.getElementById('name-stage')?.dataset.renderState==='ready'||elapsed>3000)){opened=now;curtain.classList.add('dissolving')}
  if(opened&&ctx){const progress=Math.min(1,(now-opened)/650),w=canvas.width,h=canvas.height,cell=w<600?6:8;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#f5f4ec';ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='destination-out';ctx.beginPath();
   for(let y=cell/2;y<h;y+=cell)for(let x=cell/2;x<w;x+=cell){const dist=Math.hypot((x-w*.5)/(w*.62),(y-h*.48)/(h*.68)),r=Math.max(0,Math.min(1,(progress*1.65-dist)*3.5))*cell*.74;if(r>.01){ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,Math.PI*2)}}ctx.fill();if(progress>=1){finish();return}
  }raf=requestAnimationFrame(draw)
 }
 curtain.querySelector('button').addEventListener('click',finish);document.addEventListener('keydown',key);reduced.addEventListener('change',finish);addEventListener('pagehide',finish,{once:true});addEventListener('resize',resize);resize();root.classList.add('intro-running');if(reduced.matches||!ctx)finish();else raf=requestAnimationFrame(draw);setTimeout(finish,5000);
})();
