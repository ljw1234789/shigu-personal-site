(() => {
  'use strict';
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width:761px)');
  const precise = matchMedia('(min-width:761px) and (hover:hover) and (pointer:fine)');
  const query = new URLSearchParams(location.search);
  const folioGroups = window.LJW_CASES || [];
  const order = ['yingjun-reno','solar-distance','yingjun-a7','earth-flat','yingjun-huawei','sound-candle'];
  const films = order.flatMap(id => folioGroups.flatMap(g => g.films.filter(f => f.id === id).map(f => ({ g, f }))));
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const anchor = (url, text, className = '') => {
    const a = el('a', className, text);
    a.href = url;
    return a;
  };
  const projectURL = id => 'project.html?work=' + encodeURIComponent(id);
  const asset = (url, alt, eager = false) => {
    const img = new Image();
    img.src = url; img.alt = alt; img.loading = eager ? 'eager' : 'lazy'; img.decoding = 'async';
    return img;
  };

  // Preserve native touch, keyboard, zoom and inner scrollers. Wheel input on the
  // desktop page receives a measured, time-based ease rather than per-event jumps.
  let glide = 0, glideTarget = 0, glideY = 0, glideTime = 0;
  const stopGlide = () => { if (glide) cancelAnimationFrame(glide); glide = 0; };
  const limitY = y => Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, y));
  function glideFrame(time) {
    const dt = Math.min(55, Math.max(1, time - glideTime));
    glideTime = time;
    const left = limitY(glideTarget) - glideY;
    if (Math.abs(left) < .65) {
      window.scrollTo({ top: Math.round(limitY(glideTarget)), behavior: 'instant' });
      glide = 0;
      return;
    }
    glideY += left * (1 - Math.exp(-dt / 177));
    window.scrollTo({ top: Math.round(glideY), behavior: 'instant' });
    glide = requestAnimationFrame(glideFrame);
  }
  addEventListener('wheel', e => {
    if (!precise.matches || reduced.matches || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey ||
        !e.deltaY || Math.abs(e.deltaX) > Math.abs(e.deltaY) ||
        document.querySelector('dialog[open]') || e.target.closest('textarea, select, input, [data-native-scroll]')) return;
    if (!e.cancelable) return;
    e.preventDefault();
    const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    if (!glide) {
      glideY = scrollY;
      glideTarget = glideY;
      glideTime = performance.now();
      glide = requestAnimationFrame(glideFrame);
    }
    glideTarget = limitY(glideTarget + e.deltaY * scale);
  }, { passive:false });
  for (const event of ['pointerdown','hashchange','popstate','resize']) addEventListener(event, stopGlide, {passive:true});
  addEventListener('keydown', e => { if (['Home','End','PageUp','PageDown','ArrowUp','ArrowDown',' '].includes(e.key)) stopGlide(); });
  reduced.addEventListener('change',stopGlide);

  const header = $('.folio-header');
  const toggle = $('.folio-toggle');
  const nav = $('.folio-nav');
  const services = $('.nav-services');
  const navState = on => {
    header.classList.toggle('menu-open', on);
    if (on) header.classList.remove('is-hidden');
    else services.open = false;
    toggle.setAttribute('aria-expanded', String(on));
    toggle.setAttribute('aria-label', on ? '关闭导航' : '打开导航');
  };
  toggle.addEventListener('click', () => navState(!header.classList.contains('menu-open')));
  document.addEventListener('click', e => {
    if (!header.contains(e.target)) navState(false);
    else if (services.open && !services.contains(e.target)) services.open = false;
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) navState(false); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (services.open) { services.open = false; $('summary', services).focus(); }
    else if (header.classList.contains('menu-open')) { navState(false); toggle.focus(); }
  });
  desktop.addEventListener('change', () => navState(false));
  const here = document.body.classList.contains('folio-about-page') ? 'about' :
    document.body.classList.contains('folio-list-page') || document.body.classList.contains('folio-case-page') ? 'projects' : '';
  if (here) $('[data-nav="' + here + '"]').setAttribute('aria-current', 'page');
  const contact = $('#copy-wechat');
  contact.addEventListener('click', async () => {
    const text = $('#copy-status');
    try { await navigator.clipboard.writeText(contact.dataset.wechat); text.textContent = '微信号已复制。'; }
    catch (_) { text.textContent = '可选中按钮上的微信号手动复制。'; }
  });
  function rollPill(button) {
    const text=button.textContent.trim();
    const windowLabel=el('span','roll-window');
    const tracks=el('span','roll-track');
    const copy=el('span','',text);
    copy.setAttribute('aria-hidden','true');
    tracks.append(el('span','',text),copy);
    windowLabel.append(tracks);
    button.replaceChildren(windowLabel);
    button.classList.add('roll-pill');
  }

  const hoverStops=new Set();
  function cardMotion(card, cover, film) {
    const clip=el('video','card-loop');
    clip.muted=true;clip.loop=true;clip.playsInline=true;clip.preload='none';
    clip.disablePictureInPicture=true;clip.tabIndex=-1;clip.setAttribute('aria-hidden','true');
    cover.append(clip);
    let hovering=false;
    function start(e) {
      if(e.pointerType!=='mouse'||!precise.matches||reduced.matches||document.hidden)return;
      hovering=true;
      if(!clip.getAttribute('src'))clip.src='assets/studio/hover/'+encodeURIComponent(film.id)+'.mp4';
      clip.play().catch(()=>{});
    }
    function stop(){hovering=false;clip.pause();cover.classList.remove('is-previewing');}
    clip.addEventListener('playing',()=>{if(hovering)cover.classList.add('is-previewing');else clip.pause();});
    clip.addEventListener('error',stop);
    card.addEventListener('pointerenter',start);
    card.addEventListener('pointerleave',stop);
    card.addEventListener('blur',stop);
    hoverStops.add(stop);
    return stop;
  }
  const pauseHovers=()=>hoverStops.forEach(stop=>stop());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseHovers();});
  reduced.addEventListener('change',pauseHovers);
  precise.addEventListener('change',pauseHovers);

  const grid = $('#project-grid');
  if (grid) {
    const selected = grid.dataset.gallery === 'selected';
    const cards = films.map(({g, f}) => {
      const a = anchor(projectURL(f.id), '', 'project-card');
      a.dataset.group = g.id;
      a.setAttribute('data-rise','');
      const cover = el('div', 'project-image');
      cover.dataset.cursor = 'arrow';
      cover.append(asset(f.poster,''));
      cardMotion(a,cover,f);
      const caption = el('p');
      caption.append(el('b', '', f.name), document.createTextNode(' – ' + (selected ? f.angle : g.name + ' · ' + g.field)));
      a.append(cover, caption);
      return a;
    });
    const buttons = $$('[data-filter]');
    function filter(value, announce) {
      pauseHovers();
      const group = buttons.some(b => b.dataset.filter === value) ? value : 'all';
      let index = 0;
      buttons.forEach(b => b.setAttribute('aria-pressed', String(group === b.dataset.filter)));
      cards.forEach(a => {
        a.hidden = group !== 'all' && a.dataset.group !== group;
        a.classList.toggle('is-offset', !a.hidden && index % 2 === 1);
        if (!a.hidden) index++;
      });
      if (announce) $('#filter-status').textContent = '已显示 ' + index + ' 个项目';
    }
    grid.append(...cards);
    filter(query.get('filter'), false);
    buttons.forEach(b => b.addEventListener('click', () => filter(b.dataset.filter, true)));
  }

  const project = $('#project-content');
  if (project) {
    const current = films.findIndex(({f}) => f.id === query.get('work'));
    const item = films[current];
    if (!item) {
      const section = el('div','project-head folio-wide');
      section.append(el('h1','','作品未找到'), anchor('projects.html','返回作品索引 ↗'));
      project.append(section);
    } else {
      const {g, f} = item;
      document.title = f.name + ' · 刘俊威作品集';
      const head = el('header','project-head folio-wide');
      head.append(el('p','',g.name + ' / ' + g.field),el('h1','',f.name));
      const cover = el('div','project-cover folio-wide' + (f.portrait ? ' portrait':''));
      const poster = asset(f.poster,f.name + '视频封面',true);
      if (f.portrait) cover.style.setProperty('--cover','url("' + f.poster + '")');
      const player = el('video');
      player.controls = true; player.playsInline = true; player.preload = 'none'; player.hidden = true;
      player.poster = f.poster;
      player.setAttribute('aria-label', '播放 ' + f.name);
      const play = el('button','project-play','▷ 播放成片 · ' + f.duration);
      play.type = 'button';
      play.addEventListener('click', () => {
        if (!player.getAttribute('src')) player.src = f.media;
        player.hidden = false; poster.hidden = true; play.hidden = true;
        player.play().catch(() => {});
      });
      player.addEventListener('error', () => {
        player.hidden = true; poster.hidden = false; play.hidden = false;
        play.textContent = '暂时无法载入，可打开平台原片';
      });
      cover.append(poster,player,play);
      const notes = el('div','project-notes folio-inner');
      function block(title, children) {
        const part = el('section','folio-split');
        part.setAttribute('data-rise','');
        const text = el('div');
        text.append(...children);
        part.append(el('h2','',title),text);
        return part;
      }
      notes.append(block('要解决的问题',[el('p','',f.problem),el('p','',f.angle)]));
      const bullets = el('ol','project-actions');
      f.actions.forEach(([step, desc]) => {
        const li = el('li');
        li.append(el('b','',step + '：'),document.createTextNode(desc));
        bullets.append(li);
      });
      notes.append(block('我的分工',[el('p','',g.filmRole || g.responsibility),el('p','',f.judgment),bullets]));
      if (f.evidence?.timeline?.overview) {
        const figure = el('figure','project-evidence');
        const evidence = anchor('about.html#reno16-timeline','');
        evidence.append(asset(f.evidence.timeline.overview,'以发布成片重建的 Reno16 剪映时间轴'));
        figure.append(evidence,el('figcaption','','Reno16 剪映时间轴 · 依据已发布成片重建。点图查看拆解。'));
        notes.append(figure);
      }
      const links = el('div','project-links');
      const source = anchor(f.source,'看' + f.platform + '原片 ↗','folio-pill');
      source.target = '_blank'; source.rel = 'noopener';
      links.append(source, anchor('about.html#' + (f.evidence ? 'reno16-shots' : f.id),'完整案例档案 ↗','folio-pill'));
      notes.append(block('团队作品表现',[el('p','',f.platform + ' · ' + f.views + ' 万次播放'),el('p','',g.metricNote),links]));
      const next = films[(current + 1) % films.length].f;
      const nextLink = anchor(projectURL(next.id),'','project-next');
      nextLink.dataset.cursor = 'arrow';
      nextLink.append(el('strong','','下一条作品 ↗'),el('span','',next.name));
      project.append(head,cover,notes,nextLink);
    }
  }

  $$('.nav-contact,.folio-pill').forEach(rollPill);

  // Build visual line masks from the rendered line breaks. The intersection
  // observer watches the unmasked parent, so filtered cards still reveal.
  const masks=[];
  function wrapLines(node, text, split) {
    node.textContent=text;
    const lines=[];
    if (split&&node.firstChild&&node.getBoundingClientRect().width) {
      const child=node.firstChild;
      const range=document.createRange();
      let y=null, at=0, line='';
      for (const ch of text) {
        range.setStart(child,at);
        at+=ch.length;
        range.setEnd(child,at);
        const next=range.getBoundingClientRect().top;
        if(y!==null&&line.trim()&&Math.abs(next-y)>3) {lines.push(line);line='';}
        line+=ch;
        y=next;
      }
      if(line.trim())lines.push(line);
    } else lines.push(text);
    const nodes=lines.map((line,i)=>{
      const clip=el('span','rise-window');
      const ink=el('span','rise-ink',line);
      ink.style.setProperty('--line-i',i);
      clip.append(ink);return clip;
    });
    if(nodes.length)node.replaceChildren(...nodes);
  }
  if(!reduced.matches) {
    $$('.folio-home .folio-split[data-rise], .folio-home h2[data-rise], .folio-home .insights-head[data-rise]').forEach(block=>{
      const parts=block.matches('h2')?[block]:$$('h2, :scope > p',block);
      const plain=parts.filter(p=>!p.children.length&&p.textContent.trim());
      if(!plain.length)return;
      plain.forEach(node=>{
        const text=node.textContent,split=node.tagName==='P';
        wrapLines(node,text,split);
        masks.push({node,text,split});
      });
      block.classList.add('has-line-reveal');
    });
  }
  let maskWidth=innerWidth, maskTick=0;
  addEventListener('resize',()=>{
    if(maskWidth===innerWidth||!masks.length)return;
    cancelAnimationFrame(maskTick);
    maskTick=requestAnimationFrame(()=>{
      maskWidth=innerWidth;
      masks.forEach(({node,text,split})=>wrapLines(node,text,split));
    });
  },{passive:true});

  const reel = $('.folio-reel');
  const dialog = $('.folio-dialog');
  const preview = reel && $('video',reel);
  const full = dialog && $('video',dialog);
  let watchPreview = false;
  function playPreview() {
    if (!preview) return;
    if (!watchPreview || document.hidden || dialog.open || reduced.matches) return preview.pause();
    if (!preview.getAttribute('src')) preview.src = preview.dataset.src;
    preview.play().catch(() => {});
  }
  if (reel) {
    reel.addEventListener('click', () => {
      preview.pause();
      dialog.showModal();
      document.body.classList.add('reel-open');
      if (!full.getAttribute('src')) full.src = full.dataset.src;
      else full.currentTime = 0;
      full.play().catch(() => {});
    });
    $('.folio-dialog-close',dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('reel-open');
      full.pause();
      playPreview();
    });
    document.addEventListener('visibilitychange', playPreview);
    reduced.addEventListener('change', playPreview);
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('has-risen'); observer.unobserve(e.target);
    }), { threshold: .075 });
    if (!reduced.matches) $$('[data-rise]').forEach(item => {
      if (item.getBoundingClientRect().top >= innerHeight * .7) {
        item.classList.add('will-rise'); observer.observe(item);
      }
    });
    if (reel) new IntersectionObserver(entries => {
      watchPreview = entries[0].isIntersecting; playPreview();
    }).observe(reel);
    const projectPlayer = $('.project-cover video');
    if (projectPlayer) new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting && document.fullscreenElement !== projectPlayer && document.pictureInPictureElement !== projectPlayer) projectPlayer.pause();
    }).observe(projectPlayer);
  } else {
    watchPreview = true;
    playPreview();
  }

  const features = $$('.folio-feature');
  const featureList = $('.feature-list');
  let lastY = scrollY, frame = 0;
  function viewport() {
    frame = 0;
    const y = scrollY;
    const delta = y - lastY;
    if (y < 75 || delta < -3) header.classList.remove('is-hidden');
    if (y >= 75 && delta > 3 && !header.classList.contains('menu-open') && !services.open) header.classList.add('is-hidden');
    header.classList.toggle('on-scroll',y > 18);
    lastY = y;
    if (reel && desktop.matches && !reduced.matches) {
      const r = reel.getBoundingClientRect();
      const t = Math.max(0, Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));
      reel.style.setProperty('--video-shift', ((t*2 - 1) * r.height * .1).toFixed(2) + 'px');
    } else if (reel) reel.style.setProperty('--video-shift', '0px');
    if (featureList) {
      const listTop = featureList.getBoundingClientRect().top;
      const stride = Math.max(245,Math.min(438,innerWidth * .232)) + Math.max(7,Math.min(12,innerWidth * .0063));
      features.forEach((item, i) => {
        const p = !i || !desktop.matches || reduced.matches ? 1 :
          Math.max(0,Math.min(1,(innerHeight * .63 - listTop - i * stride) / (innerHeight * .215)));
        item.style.setProperty('--step-open', p.toFixed(3));
        item.classList.toggle('is-open',p > .24);
      });
    }
  }
  const refresh = () => { if (!frame) frame = requestAnimationFrame(viewport); };
  addEventListener('scroll', refresh, {passive:true});
  addEventListener('resize', refresh, {passive:true});
  addEventListener('hashchange', refresh);
  reduced.addEventListener('change', refresh);
  viewport();

  const pointer = el('div','folio-cursor');
  const glyph = el('span','cursor-glyph');
  pointer.append(glyph);
  pointer.setAttribute('aria-hidden','true');
  document.body.append(pointer);
  let px=0,py=0,tx=0,ty=0,entry=false,cursorFrame=0,cursorTime=0,angle=0,stretch=0;
  const hidePointer = () => {
    entry=false;
    if(cursorFrame)cancelAnimationFrame(cursorFrame);
    cursorFrame=0;
    pointer.classList.remove('is-visible','is-action','is-link');
    document.body.classList.remove('has-folio-cursor');
  };
  function pointerMode(target) {
    const active = target?.closest('[data-cursor]');
    const action = active && active.dataset.cursor;
    pointer.classList.toggle('is-action',!!action);
    pointer.classList.toggle('is-link',!action&&!!target?.closest('a,button,summary'));
    glyph.textContent = action === 'play' ? '▷' : action ? '↗' : '';
  }
  function moveCursor(time) {
    cursorFrame=0;
    if(!entry)return;
    const dt=Math.max(1,Math.min(40,time-cursorTime));
    cursorTime=time;
    const dx=tx-px,dy=ty-py,d=Math.hypot(dx,dy);
    const ease=1-Math.exp(-dt/65);
    px+=dx*ease;py+=dy*ease;
    if(d>1)angle=Math.atan2(dy,dx)*180/Math.PI;
    stretch+=(Math.min(.27,d*.0025)-stretch)*Math.min(1,dt/55);
    pointer.style.setProperty('--x',px.toFixed(2)+'px');
    pointer.style.setProperty('--y',py.toFixed(2)+'px');
    pointer.style.setProperty('--cursor-angle',angle.toFixed(2)+'deg');
    pointer.style.setProperty('--long',(1+stretch).toFixed(3));
    pointer.style.setProperty('--short',(1-.62*stretch).toFixed(3));
    if(d>.25||stretch>.002)cursorFrame=requestAnimationFrame(moveCursor);
  }
  function point(e) {
    if(!precise.matches||reduced.matches||dialog?.open||e.altKey) return hidePointer();
    if(e.clientX>document.documentElement.clientWidth||e.clientY<0)return hidePointer();
    tx=e.clientX;ty=e.clientY;
    if(!entry) {px=tx;py=ty;entry=true;}
    pointerMode(e.target);
    pointer.style.setProperty('--x',px+'px');
    pointer.style.setProperty('--y',py+'px');
    pointer.classList.add('is-visible');
    document.body.classList.add('has-folio-cursor');
    if(!cursorFrame){cursorTime=performance.now();cursorFrame=requestAnimationFrame(moveCursor);}
  }
  addEventListener('pointermove',e=>{if(e.pointerType==='mouse')point(e);else hidePointer();},{passive:true});
  addEventListener('wheel',point,{passive:true});
  document.addEventListener('pointerleave',hidePointer);
  addEventListener('blur',hidePointer);
  addEventListener('scroll',()=>{if(entry)pointerMode(document.elementFromPoint(tx,ty));},{passive:true});
  reduced.addEventListener('change',hidePointer);
  precise.addEventListener('change',hidePointer);
  reel?.addEventListener('click',hidePointer);
})();
