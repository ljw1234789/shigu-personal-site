(() => {
  'use strict';
  const { projects, icon, toolIcon } = window.PERSONAL_SITE;
  const tools = window.CREATIVE_TOOLS || [];
  const safe = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dialog = document.getElementById('detail-dialog');
  const content = document.getElementById('detail-content');
  const heading = document.getElementById('detail-title');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = '', returnFocus = null, baseHash = '', toastTimer;
  document.getElementById('case-grid').innerHTML = projects.map(p => `<a class="case-card" href="#project-${p.id}" data-detail="project-${p.id}" aria-label="查看案例：${p.name}"><div class="case-cover"><img src="assets/projects/${p.image}.jpg" alt="${p.title}" width="440" height="330" loading="lazy"><span class="case-play" aria-hidden="true">▶</span></div><div class="case-copy"><p class="case-meta">${p.type} · ${p.date}</p><h3>${p.name}</h3><p class="case-title">${p.title}</p><div class="case-results"><span><strong>${p.likes}</strong>点赞</span><span><strong>${p.shares}</strong>分享</span></div><span class="case-open">查看案例 <span aria-hidden="true">↗</span></span></div></a>`).join('');
  document.getElementById('homepage-tools').innerHTML = tools.map(t => `<a class="homepage-tool" href="#tool-${t.id}" data-detail="tool-${t.id}" aria-label="打开${safe(t.name)}"><div class="tool-card-top"><span class="icon-art">${icon(toolIcon(t))}</span></div><h3>${safe(t.name)}</h3><p>${safe(t.summary)}</p><div class="tool-card-bottom"><span>${safe(t.category)}</span><span aria-hidden="true">↗</span></div></a>`).join('');
  function projectContent(p) {
    return `<div class="window-content"><div class="section-heading"><div><h3>${p.name}</h3><p>${p.type} · ${p.date}</p></div></div><div class="project-detail"><div class="detail-visual"><div data-player="${p.video}"><button class="detail-poster" data-play="${p.video}" aria-label="播放：${p.title}"><img src="assets/projects/${p.image}.jpg" alt="${p.title}"><span class="play-mark"><span>▶</span></span></button></div><div class="video-actions"><a href="https://www.douyin.com/video/${p.video}" target="_blank" rel="noopener">在抖音看原片 ↗</a><button data-stop="${p.video}" hidden>收起播放器</button></div></div><div class="detail-copy"><h3>${p.question}</h3><p>${p.copy}</p><dl class="metrics">${[['点赞',p.likes],['评论',p.comments],['收藏',p.saves],['分享',p.shares]].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><p class="metric-date">抖音公开互动数据 · 截至 2026.10.14</p><div class="responsibility"><h4>我参与的工作</h4><p>AI 辅助选题、脚本撰写、视频剪辑，以及发布后的评论反馈整理与复盘。</p></div></div></div></div>`;
  }
  function toolContent(t) {
    if(t.url) return `<div class="tool-navigation"><p>${t.mode==='online'?'项目和记录保存在原工具中。':t.mode==='hybrid'?'在线预览；下载与解析使用 Mac 本机版。':'在线体验；真实 AI 点评需要本机助手。'}</p>${t.local?`<a href="${safe(t.local)}" target="_blank" rel="noopener">打开本机版 ↗</a>`:''}<a href="${safe(t.url)}" target="_blank" rel="noopener">独立打开 ↗</a></div><iframe class="tool-iframe" title="${safe(t.name)}实际界面" src="${safe(t.url)}" allow="fullscreen; clipboard-write" allowfullscreen></iframe>`;
    return `<div class="local-intro"><div class="icon-art">${icon(toolIcon(t))}</div><h3>${safe(t.summary)}</h3><p>${safe(t.detail)}</p><ol>${t.steps.map(s=>`<li>${safe(s)}</li>`).join('')}</ol><a class="action" href="${safe(t.local)}" target="_blank" rel="noopener">打开本机${safe(t.name)} ↗</a><details><summary>启动说明</summary><p>在装有工具的 Mac 上，先双击「${safe(t.launcher)}」，再打开上方入口。</p><p>${safe(t.note)}</p></details></div>`;
  }

  const details = {};
  projects.forEach(p => { details[`project-${p.id}`] = {title:p.name, body:()=>projectContent(p)}; });
  tools.forEach(t => { details[`tool-${t.id}`] = {title:t.name, body:()=>toolContent(t), tool:!!t.url}; });
  details.site = { title:'关于网站', body:()=>`<div class="window-content site-info"><h3>内容、作品与工具。</h3><p>个人介绍、参与项目与创作工具：刘俊威。</p><p>首页保留四季动效和姓名展示字，入场节奏参考 <a href="https://www.ondastudio.co/" target="_blank" rel="noopener">Onda Studio</a>。原桌面交互参考 <a href="https://www.sharyap.com/" target="_blank" rel="noopener">Sharlene Yap</a>。</p><p>场景画面与独立 3D 世界基于 <a href="https://github.com/brunosimon/folio-2025" target="_blank" rel="noopener">Bruno Simon · Folio 2025</a>，保留 <a href="world/BRUNO-LICENSE.md" target="_blank">MIT 许可</a>。姓名字体为思源宋体子集，保留 <a href="assets/fonts/OFL-SourceHanSerif.txt" target="_blank">OFL 许可</a>。</p></div>` };
  function openDetail(id, push = true, trigger = null) {
    const detail = details[id]; if (!detail) return;
    if (current === id && dialog.open) return;
    if (!dialog.open) {
      returnFocus = trigger || document.activeElement;
      baseHash = Object.hasOwn(details, location.hash.slice(1)) ? (id.startsWith('project-')?'#projects':id.startsWith('tool-')?'#tools':'') : location.hash;
    }
    current = id; heading.textContent = detail.title;
    dialog.classList.toggle('is-tool-detail', Boolean(detail.tool));
    content.className = `detail-content${detail.tool?' tool-body':''}`;
    content.innerHTML = detail.body(); content.scrollTop = 0;
    document.body.classList.add('detail-open');
    if (!dialog.open) dialog.showModal();
    if (push) history.pushState({detailOverlay:true}, '', `${location.pathname}${location.search}#${id}`);
    heading.focus({preventScroll:true});
  }
  function closeDetail(route = true) {
    if (!dialog.open) return;
    if (route && history.state?.detailOverlay) { history.back(); return; }
    dialog.close(); content.replaceChildren(); current = '';
    document.body.classList.remove('detail-open');
    if (route) history.replaceState(null, '', `${location.pathname}${location.search}${baseHash}`);
    if (returnFocus?.isConnected && returnFocus !== document.body) returnFocus.focus({preventScroll:true});
  }
  function route() {
    const id = location.hash.slice(1);
    if (details[id]) { openDetail(id,false); return; }
    closeDetail(false);
    const aliases = {cases:'projects',showcase:'projects',myProjects:'projects',myTools:'tools',about:'intro',home:'top',links:'tools'};
    if (aliases[id]) {
      history.replaceState(null, '', `${location.pathname}${location.search}#${aliases[id]}`);
      document.getElementById(aliases[id])?.scrollIntoView();
    }
  }
  function showToast(text) {
    const toast = document.getElementById('desktop-status'); toast.textContent=text; toast.classList.add('visible');
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('visible'),2500);
  }
  document.addEventListener('click', async event => {
    const link = event.target.closest('[data-detail]');
    if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); openDetail(link.dataset.detail,true,link); return; }
    const play = event.target.closest('[data-play]');
    if (play) {
      const p=projects.find(p=>p.video===play.dataset.play); if(!p)return;
      const frame=document.createElement('iframe'); frame.className='video-frame'; frame.title=p.title;
      frame.src=`https://open.douyin.com/player/video?vid=${p.video}&autoplay=0`;
      frame.allow='fullscreen; autoplay; encrypted-media; picture-in-picture'; frame.allowFullscreen=true; frame.referrerPolicy='unsafe-url';
      play.parentElement.replaceChildren(frame); content.querySelector('[data-stop]').hidden=false; return;
    }
    if (event.target.closest('[data-stop]')) { const detail=details[current]; if(detail)content.innerHTML=detail.body(); return; }
    if (event.target.closest('[data-copy-site]')) {
      try { await navigator.clipboard.writeText('https://ljw1234789.github.io/shigu-personal-site/'); showToast('网站链接已复制'); }
      catch { showToast('请复制浏览器地址栏中的网站链接'); }
    }
  });
  dialog.querySelector('.detail-close').addEventListener('click',()=>closeDetail());
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeDetail();});
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDetail();
  });
  const motion=document.getElementById('motion-toggle');
  function setMotion(paused){document.body.classList.toggle('is-paused',paused);motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'▷':'Ⅱ';motion.setAttribute('aria-label',paused?'播放四季动效':'暂停四季动效');motion.title=motion.getAttribute('aria-label');}
  setMotion(reduced.matches);motion.addEventListener('click',()=>setMotion(!document.body.classList.contains('is-paused')));reduced.addEventListener('change',event=>setMotion(event.matches));
  let pointerFrame=0;
  document.addEventListener('pointermove',event=>{
    if(reduced.matches||document.body.classList.contains('is-paused')||event.pointerType==='touch'||pointerFrame)return;
    pointerFrame=requestAnimationFrame(()=>{document.documentElement.style.setProperty('--px',`${(event.clientX/innerWidth-.5)*14}px`);document.documentElement.style.setProperty('--py',`${(event.clientY/innerHeight-.5)*12}px`);pointerFrame=0;});
  },{passive:true});
  addEventListener('popstate',route);addEventListener('hashchange',route);
  route();
})();
