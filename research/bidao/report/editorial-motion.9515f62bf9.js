'use strict';
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const clamp=n=>Math.max(0,Math.min(1,n));
  const headings=[...document.querySelectorAll('.section-head h2,.subsection-head h3,.workbench-heading h3')];
  const tracked=[];
  headings.forEach(heading=>{
    // Preserve accessible text while treating only display headings as moving type.
    const label=[...heading.childNodes].map(n=>n.nodeName==='BR'?' ':n.textContent).join('').replace(/\s+/g,' ').trim();
    heading.setAttribute('aria-label',label);heading.classList.add('motion-heading');
    const glyphs=[];
    [...heading.childNodes].forEach(node=>{
      if(node.nodeType!==Node.TEXT_NODE)return;
      const fragment=document.createDocumentFragment();
      [...node.textContent].forEach(char=>{
        const span=document.createElement('span');span.className='motion-glyph';span.setAttribute('aria-hidden','true');span.textContent=char;fragment.append(span);glyphs.push(span);
      });
      node.replaceWith(fragment);
    });
    tracked.push({heading,glyphs});
  });
  const scene=document.querySelector('.team-motion'),stage=document.querySelector('.team-motion-stage');
  const steps=[...document.querySelectorAll('.flow .step')];
  const status=document.getElementById('flowStatus');
  const dots=[...document.querySelectorAll('.flow-status i')];
  const names=['选题初筛','资料调研','脚本创作','拍摄／剪辑'];
  let frame=0;
  function render(){
    frame=0;
    const h=innerHeight;
    tracked.forEach(({heading,glyphs})=>{
      const rect=heading.getBoundingClientRect();
      if(rect.bottom<0||rect.top>h+100)return;
      const p=reduced.matches?1:clamp((h*.96-rect.top)/(h*.4));
      glyphs.forEach((glyph,i)=>{
        const q=clamp((p-i/Math.max(1,glyphs.length)*.25)/.75);
        glyph.style.opacity=String(.24+.76*q);
        glyph.style.filter=`blur(${((1-q)*5).toFixed(2)}px)`;
        glyph.style.transform=`translateY(${((1-q)*12).toFixed(2)}px)`;
      });
    });
    if(scene&&stage){
      const r=scene.getBoundingClientRect();
      const mobile=innerWidth<=680;
      const p=reduced.matches?1:mobile?clamp((h*.7-r.top)/(r.height*.6)):clamp((110-r.top)/Math.max(1,r.height-stage.offsetHeight));
      let current=0;
      steps.forEach((step,i)=>{
        const q=clamp((p-i*.13)/.55);
        step.style.setProperty('--flow-p',q.toFixed(4));
        step.style.setProperty('--flow-rise',`${(q*160).toFixed(1)}px`);
        step.classList.toggle('is-filled',q>.55);
        if(q>.55)current=i;
      });
      if(status)status.textContent=`0${current+1} / ${names[current]}`;
      dots.forEach((dot,i)=>dot.classList.toggle('is-current',i===current));
    }
  }
  function queue(){if(!frame)frame=requestAnimationFrame(render)}
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});addEventListener('lab:entered',queue);
  reduced.addEventListener('change',queue);queue();
  // Short, local magnetic movement belongs to controls; body copy stays still.
  document.querySelectorAll('.entry-enter,.hero-copy .btn,.workbench-bottom button').forEach(button=>{
    button.dataset.magnetic='';let pointerFrame=0,point=null;
    const reset=()=>{cancelAnimationFrame(pointerFrame);pointerFrame=0;point=null;button.style.setProperty('--magnetic-x','0px');button.style.setProperty('--magnetic-y','0px')};
    button.addEventListener('pointermove',event=>{
      if(reduced.matches||!fine.matches||event.pointerType!=='mouse')return;
      const r=button.getBoundingClientRect();point={x:(event.clientX-r.left-r.width/2)/r.width*12,y:(event.clientY-r.top-r.height/2)/r.height*8};
      if(!pointerFrame)pointerFrame=requestAnimationFrame(()=>{pointerFrame=0;if(!point)return;button.style.setProperty('--magnetic-x',point.x.toFixed(1)+'px');button.style.setProperty('--magnetic-y',point.y.toFixed(1)+'px')});
    },{passive:true});button.addEventListener('pointerleave',reset);button.addEventListener('blur',reset);reduced.addEventListener('change',reset);
  });
  // Paper rows open in reading order when a workflow panel is selected.
  document.querySelectorAll('.work-panel').forEach(panel=>{
    panel.querySelectorAll('.work-facts>div,.script-pairs>div,.work-output').forEach((row,i)=>row.style.setProperty('--row-order',i));
  });
})();

(() => {
  const button=document.getElementById('entryQuestionNext');
  const text=document.getElementById('entryQuestionText');
  const count=document.getElementById('entryQuestionCount');
  if(!button||!text||!count)return;
  const questions=['刻度写着100 mL，倒出来也一样吗？','盘子上的X，是谁画上去的？','不用打气的足球，靠什么撑起来？'];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let index=0,currentAnimation=null;
  button.addEventListener('click',()=>{
    index=(index+1)%questions.length;
    currentAnimation?.cancel();
    text.textContent=questions[index];count.textContent=`0${index+1} / 03`;
    if(!reduced.matches)currentAnimation=text.animate([{opacity:0,transform:'translateY(9px)',filter:'blur(3px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:400,easing:'cubic-bezier(.22,1,.36,1)'});
  });
})();
