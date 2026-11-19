(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mouse = matchMedia('(min-width:761px) and (hover:hover) and (pointer:fine)');
  const make = (tag, cls, text) => {
    const node=document.createElement(tag);
    if(cls) node.className=cls;
    if(text!=null) node.textContent=text;
    return node;
  };

  // The same five evidence cards remain links when scripting or hover is absent.
  const fan=$('.fan-stack');
  if(fan) {
    const button=make('button','fan-unfold','展开卡片');
    button.type='button'; button.setAttribute('aria-controls','evidence-cards');
    button.setAttribute('aria-expanded','false'); fan.id='evidence-cards';
    fan.before(button);
    let pinned=false;
    const spread=on=>{
      fan.classList.toggle('is-spread',on);
      button.setAttribute('aria-expanded',String(on));
      button.textContent=on?'收起卡片':'展开卡片';
    };
    fan.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&mouse.matches) spread(true);});
    fan.addEventListener('pointerleave',()=>{if(!pinned&&!fan.contains(document.activeElement)) spread(false);});
    fan.addEventListener('focusin',()=>spread(true));
    fan.addEventListener('focusout',e=>{if(!pinned&&!fan.contains(e.relatedTarget)) spread(false);});
    button.addEventListener('click',()=>{pinned=!pinned; spread(pinned);});
    fan.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=false;spread(false);button.focus();}});
  }

  // Desktop uses the reference's hover menu; click and keyboard keep native details.
  const services=$('.nav-services');
  if(services) {
    let closeTimer;
    services.addEventListener('pointerenter',e=>{
      if(e.pointerType!=='mouse'||!mouse.matches) return;
      clearTimeout(closeTimer); services.open=true;
    });
    services.addEventListener('pointerleave',()=>{
      if(mouse.matches) closeTimer=setTimeout(()=>{
        if(!services.contains(document.activeElement)) services.open=false;
      },160);
    });
  }

  $$('.nav-contact,.folio-pill,.folio-more>span').forEach(button=>{
    button.addEventListener('pointermove',e=>{
      if(!mouse.matches||reduced.matches) return;
      const r=button.getBoundingClientRect();
      const x=Math.max(-8,Math.min(8,(e.clientX-r.left-r.width/2)*.14));
      const y=Math.max(-6,Math.min(6,(e.clientY-r.top-r.height/2)*.18));
      button.style.translate=x+'px '+y+'px';
    });
    button.addEventListener('pointerleave',()=>{button.style.translate='';});
    button.addEventListener('blur',()=>{button.style.translate='';});
  });

  // Turn the existing source rows into usable reading states, retaining every row.
  const widgets={
    'reno16-draft-history':'versions',
    'reno16-shoot-checklist':'shots',
    'comment-topic-proof':'topics'
  };
  Object.entries(widgets).forEach(([id,mode])=>{
    const section=document.getElementById(id);
    if(!section) return;
    const source=$('.proof-table-scroll',section);
    if(!source) return;
    const headers=$$('thead th',source).map(n=>n.textContent);
    const rows=$$('tbody tr',source).map(row=>[...row.children].map(n=>n.textContent));
    const widget=make('div','proof-switcher proof-switcher--'+mode);
    const controls=make('div','proof-tabs');
    controls.setAttribute('role','tablist');
    controls.setAttribute('aria-label',mode==='versions'?'四版改稿':mode==='shots'?'五个镜头':'四个选题');
    controls.setAttribute('data-native-scroll','');
    const panel=make('div','proof-active');
    panel.id=id+'-active'; panel.tabIndex=0; panel.setAttribute('role','tabpanel');
    const buttons=rows.map((row,index)=>{
      const label=mode==='versions'?'V'+(index+1):mode==='shots'?row[0]:'选题 '+(index+1);
      const b=make('button','',label);
      b.type='button'; b.id=id+'-tab-'+index; b.setAttribute('role','tab');
      b.setAttribute('aria-controls',panel.id);
      controls.append(b); return b;
    });
    const maxDuration=mode==='versions'?Math.max(...rows.map(r=>parseFloat(r[2]))):1;
    function activate(index,focus=false) {
      buttons.forEach((button,i)=>{
        button.setAttribute('aria-selected',String(i===index));
        button.tabIndex=i===index?0:-1;
      });
      const row=rows[index];
      panel.setAttribute('aria-labelledby',buttons[index].id);
      const content=make('div','proof-active-content');
      if(mode==='versions') {
        content.append(make('p','proof-overline',row[0]));
        content.append(make('p','proof-statement',row[1]));
        const stats=make('div','trial-stats');
        const total=make('div');
        total.append(make('strong','trial-number',row[2]),make('span','','整稿系统语音试读'));
        const part=make('div');
        part.append(make('strong','trial-part',row[3]),make('span','','本轮重点段落'));
        stats.append(total,part); content.append(stats);
        const track=make('div','trial-track');
        track.setAttribute('aria-hidden','true');
        const bar=make('i'); bar.style.setProperty('--trial-ratio',parseFloat(row[2])/maxDuration);
        track.append(bar); content.append(track);
      } else {
        content.append(make('p','proof-overline',mode==='shots'?'复拍计划 · '+row[0]:'下一轮拟拍 · '+row[1]));
        content.append(make('p','proof-statement',mode==='shots'?row[3]:row[0]));
        const dl=make('dl','proof-parameters');
        const props=mode==='shots'&&row[2]==='同上'?rows.slice(0,index).reverse().find(r=>r[2]!=='同上')?.[2]||row[2]:row[2];
        const fields=mode==='shots'?[[headers[1],row[1]],[headers[2],props]]:[[headers[2],row[2]]];
        fields.forEach(([label,value])=>{const pair=make('div'); pair.append(make('dt','',label),make('dd','',value));dl.append(pair);});
        content.append(dl);
      }
      panel.replaceChildren(content);
      if(!reduced.matches) content.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:480,easing:'cubic-bezier(.25,1,.5,1)'});
      if(focus) buttons[index].focus();
    }
    buttons.forEach((button,i)=>button.addEventListener('click',()=>activate(i)));
    controls.addEventListener('keydown',e=>{
      let index=buttons.indexOf(document.activeElement);
      if(index<0) return;
      if(e.key==='ArrowRight'||e.key==='ArrowDown') index=(index+1)%rows.length;
      else if(e.key==='ArrowLeft'||e.key==='ArrowUp') index=(index+rows.length-1)%rows.length;
      else if(e.key==='Home') index=0;
      else if(e.key==='End') index=rows.length-1;
      else return;
      e.preventDefault(); activate(index,true);
    });
    widget.append(controls,panel);
    const records=make('details','proof-records');
    records.append(make('summary','',mode==='versions'?'查看四版完整记录':mode==='shots'?'查看完整拍摄清单':'查看全部选题与原评论编号'),source);
    const body=$('.proof-body',section);
    body.prepend(widget,records);
    section.classList.add('has-proof-switcher');
    activate(0);
  });

  // Animate the native disclosure height, including interrupted close/open clicks.
  $$('.faq-items details,.proof-records').forEach(details=>{
    const summary=$('summary',details);
    let animation, intent=details.open;
    summary.addEventListener('click',e=>{
      if(reduced.matches) return;
      e.preventDefault();
      const from=details.getBoundingClientRect().height;
      animation?.cancel(); intent=!intent;
      details.style.height='auto'; details.open=true;
      const to=intent?details.getBoundingClientRect().height:summary.getBoundingClientRect().height;
      details.style.overflow='hidden';
      animation=details.animate([{height:from+'px'},{height:to+'px'}],{duration:580,easing:'cubic-bezier(.25,1,.5,1)'});
      details.classList.toggle('is-opening',intent);
      animation.onfinish=()=>{
        details.open=intent; details.style.height=''; details.style.overflow=''; animation=null;
      };
    });
    details.addEventListener('toggle',()=>{if(!animation) intent=details.open;});
  });

  // Elastic separators follow the pointer and settle with a damped spring.
  $$('.faq-items details').forEach(item=>{
    const line=make('div','elastic-line');
    line.setAttribute('aria-hidden','true');
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    const path=document.createElementNS(ns,'path');
    svg.setAttribute('preserveAspectRatio','none'); svg.append(path);line.append(svg);item.prepend(line);
    let width=item.clientWidth,x=width/2,y=0,target=0,velocity=0,frame=0,last=0;
    const draw=()=>{svg.setAttribute('viewBox','0 -32 '+width+' 64');path.setAttribute('d','M0 0 Q'+x+' '+y+' '+width+' 0');};
    const tick=time=>{
      const dt=Math.min(2,(time-(last||time-16))/16.67); last=time;
      velocity+=(target-y)*.11*dt;velocity*=Math.pow(.73,dt);y+=velocity*dt;draw();
      if(Math.abs(target-y)>.08||Math.abs(velocity)>.08) frame=requestAnimationFrame(tick);else frame=0;
    };
    const wake=()=>{if(!frame){last=0;frame=requestAnimationFrame(tick);}};
    item.addEventListener('pointermove',e=>{
      if(!mouse.matches||reduced.matches) return;
      const r=item.getBoundingClientRect();width=r.width;x=e.clientX-r.left;
      target=Math.max(-24,Math.min(24,(e.clientY-r.top)*.45));wake();
    });
    item.addEventListener('pointerleave',()=>{target=0;wake();});
    new ResizeObserver(()=>{width=item.clientWidth;draw();}).observe(item);
    draw();
  });

  // Evidence images open as a gallery, with captions and keyboard navigation.
  const imageLinks=$$('.proof-figure a,.flow-screenshot>a,.project-evidence a').filter(a=>/\.(?:png|jpe?g|webp)(?:\?|$)/i.test(a.getAttribute('href')||''));
  if(imageLinks.length) {
    const lightbox=make('dialog','evidence-lightbox');
    lightbox.setAttribute('aria-label','查看制作记录');
    const toolbar=make('div','evidence-toolbar');
    const count=make('span','evidence-count');count.setAttribute('aria-live','polite');
    const close=make('button','','关闭');close.type='button';close.setAttribute('aria-label','关闭图片');
    const prev=make('button','evidence-prev','上一张');prev.type='button';
    const next=make('button','evidence-next','下一张');next.type='button';
    const zoom=make('button','evidence-zoom','查看原尺寸');zoom.type='button';
    toolbar.append(count,zoom,close);
    const figure=make('figure');const image=new Image();const caption=make('figcaption');
    image.hidden=true;
    figure.append(image,caption);lightbox.append(toolbar,prev,figure,next);document.body.append(lightbox);
    let index=0,opener;
    function show(i) {
      index=(i+imageLinks.length)%imageLinks.length;
      const link=imageLinks[index],thumb=$('img',link);
      image.src=link.href;image.alt=thumb?.alt||'制作记录';
      image.hidden=false;
      caption.textContent=$('figcaption',link.closest('figure'))?.textContent||image.alt;
      count.textContent=(index+1)+' / '+imageLinks.length;
      lightbox.classList.remove('is-zoomed'); zoom.textContent='查看原尺寸';
    }
    imageLinks.forEach((link,i)=>{
      link.dataset.cursor='expand';
      link.addEventListener('click',e=>{
        if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button) return;
        e.preventDefault();opener=link;show(i);lightbox.showModal();
        document.body.classList.add('evidence-open');close.focus();
      });
    });
    const shut=()=>lightbox.close();
    close.addEventListener('click',shut);prev.addEventListener('click',()=>show(index-1));next.addEventListener('click',()=>show(index+1));
    zoom.addEventListener('click',()=>{const on=lightbox.classList.toggle('is-zoomed');zoom.textContent=on?'适应窗口':'查看原尺寸';});
    lightbox.addEventListener('click',e=>{if(e.target===lightbox) shut();});
    lightbox.addEventListener('keydown',e=>{
      if(e.key==='ArrowLeft'){e.preventDefault();show(index-1);}
      if(e.key==='ArrowRight'){e.preventDefault();show(index+1);}
    });
    lightbox.addEventListener('close',()=>{document.body.classList.remove('evidence-open');opener?.focus({preventScroll:true});});
  }

  // Shared covers and a document crossfade preserve the link/back-button model.
  document.addEventListener('click',e=>{
    if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button) return;
    const link=e.target.closest('a[data-work]');
    if(!link||link.target==='_blank') return;
    sessionStorage.setItem('folio:transition-work',link.dataset.work);
    $$('.project-image,.project-cover').forEach(node=>{node.style.viewTransitionName='';});
    const cover=$('.project-image',link);
    if(cover) cover.style.viewTransitionName='selected-work';
  });
  const selectedWork=sessionStorage.getItem('folio:transition-work');
  if(selectedWork) {
    const cover=$('.project-cover');
    if(cover?.dataset.work===selectedWork) cover.style.viewTransitionName='selected-work';
    sessionStorage.removeItem('folio:transition-work');
  }

  const chapters=$('.case-chapters');
  if(chapters) {
    const links=$$('a',chapters),sections=links.map(a=>document.getElementById(a.hash.slice(1))).filter(Boolean);
    let scheduled=false;
    const update=()=>{
      scheduled=false;
      let active=0;
      sections.forEach((section,i)=>{if(section.getBoundingClientRect().top<innerHeight*.43)active=i;});
      links.forEach((a,i)=>{if(i===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
      const start=sections[0].getBoundingClientRect().top+scrollY;
      const end=sections.at(-1).getBoundingClientRect().bottom+scrollY-innerHeight;
      chapters.style.setProperty('--reading',Math.max(0,Math.min(1,(scrollY-start)/(end-start||1))));
    };
    addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}},{passive:true});
    update();
  }

  // New evidence participates in the same entrance system as the original gallery.
  const targets=$$('.proof-intro,.proof-body,.project-head,.case-study>.case-top,.flow-screenshot,.flow-copy');
  if(!reduced.matches&&'IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
      if(isIntersecting){target.classList.add('is-seen');observer.unobserve(target);}
    }),{threshold:.04,rootMargin:'0px 0px -3% 0px'});
    targets.forEach(target=>{
      target.classList.add('motion-reveal');
      if(target.getBoundingClientRect().top<innerHeight*.93)target.classList.add('is-seen');else observer.observe(target);
    });
    reduced.addEventListener('change',()=>{if(reduced.matches)targets.forEach(t=>t.classList.add('is-seen'));});
  }

  // Keep a paused proof recording from competing with the main case video.
  $$('video').forEach(video=>video.addEventListener('play',()=>{
    if(!video.controls) return;
    $$('video[controls]').forEach(other=>{if(other!==video)other.pause();});
  }));
})();
