(() => {
  'use strict';
  const { projects, icon, toolIcon } = window.PERSONAL_SITE;
  const tools = window.CREATIVE_TOOLS || [];
  const evidence = window.PROJECT_EVIDENCE;
  const safe = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dialog = document.getElementById('detail-dialog');
  const content = document.getElementById('detail-content');
  const heading = document.getElementById('detail-title');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = '', returnFocus = null, baseHash = '', toastTimer;
  const featured = ['dry-ice','coastline','behind'].map(id=>projects.find(p=>p.id===id));
  const workResults = document.getElementById('work-results');
  if(workResults) workResults.innerHTML = `<div><strong>${evidence.totals.bilibiliViews}</strong><span>所列三条视频 · B 站累计播放</span></div><div><strong>${evidence.totals.douyinLikes}</strong><span>所列三条视频 · 抖音累计点赞</span></div>`;
  document.getElementById('case-grid').innerHTML = featured.map((p,i) => `<a class="case-card" href="#project-${p.id}" data-detail="project-${p.id}" aria-label="查看案例：${p.name}"><div class="case-cover"><img src="assets/projects/${p.image}.jpg" alt="${p.title}" width="440" height="330" loading="eager"><span class="case-play" aria-hidden="true">▶</span></div><div class="case-copy"><div class="case-caption"><h3>${p.name}</h3><span class="case-index">0${i+1} / 03</span></div><div class="case-results"><span>B 站 <strong>${evidence.projects[p.id].bilibili.views}</strong> 播放</span><span>抖音 <strong>${evidence.projects[p.id].douyin.likes}</strong> 赞</span><span aria-hidden="true">↗</span></div><p class="case-role">我的参与：AI 辅助选题、脚本、剪辑与发布复盘</p></div></a>`).join('');
  document.getElementById('homepage-tools').innerHTML = tools.map(t => `<a class="homepage-tool" href="#tool-${t.id}" data-detail="tool-${t.id}" aria-label="打开${safe(t.name)}"><div class="tool-card-top"><span class="icon-art">${icon(toolIcon(t))}</span></div><h3>${safe(t.name)}</h3><p>${safe(t.summary)}</p><div class="tool-card-bottom"><span>${safe(t.category)}</span><span aria-hidden="true">↗</span></div></a>`).join('');
  function projectContent(p) {
    const e=evidence.projects[p.id], b=e.bilibili, d=e.douyin;
    const cells = list => list.map(([label,value])=>`<div><dt>${safe(label)}</dt><dd>${safe(value)}</dd></div>`).join('');
    return `<div class="window-content evidence-case">
      <div class="section-heading"><div><h3>${p.name}</h3><p>${p.type} · ${p.date} · ${e.duration}</p></div></div>
      <p class="case-role-line"><span>我的参与</span>AI 辅助选题 · 脚本撰写 · 视频剪辑 · 发布复盘</p><div class="project-detail"><div class="detail-visual"><div data-player="${p.video}"><button class="detail-poster" data-play="${p.video}" aria-label="播放：${p.title}"><img src="assets/projects/${p.image}.jpg" alt="${p.title}"><span class="play-mark"><span>▶</span></span></button></div><div class="video-actions"><a href="${d.url}" target="_blank" rel="noopener">抖音原片 ↗</a><a href="${b.url}" target="_blank" rel="noopener">B 站原片 ↗</a><button data-stop="${p.video}" hidden>收起播放器</button></div></div>
      <div class="detail-copy"><h3>${p.question}</h3><p>${p.copy}</p>${b.recognition?`<p class="case-recognition">B 站 · ${b.recognition}</p>`:''}<dl class="metrics">${cells([['B 站播放',b.views],['B 站点赞',b.likes],['抖音点赞',d.likes],['抖音分享',d.shares]])}</dl><p class="metric-date">团队作品公开表现 · ${evidence.checkedAt} 核验</p></div></div>
      <section class="case-reading"><header><p>成片表达分析</p><h3>${e.focus}</h3></header><p class="case-context">${e.context}</p><div class="case-reading-grid">${e.breakdown.map((item,i)=>`<article><span class="case-step">0${i+1}</span><h4>${item.title}</h4><p>${item.text}</p></article>`).join('')}</div></section>
      <figure class="case-evidence-figure"><img src="${e.still.src}" alt="${safe(e.still.caption)}" width="945" height="540" loading="lazy"><figcaption><span>成片截图 · ${e.still.time}</span><span>${e.still.caption}</span></figcaption></figure>
      <section class="case-feedback"><h3>观众反馈与复盘观察</h3><ul>${e.feedback.map(t=>`<li>${t}</li>`).join('')}</ul><p>基于原页可见评论整理。</p></section>
      <details class="case-source-record"><summary>查看完整数据与来源 <span>2026.10.29</span></summary><div class="platform-records">
        <section><h4>哔哩哔哩 <a href="${b.url}" target="_blank" rel="noopener">核对原页 ↗</a></h4><p>${b.author} · ${b.published}</p><dl>${cells([['播放',b.views],['弹幕',b.danmaku],['点赞',b.likes],['投币',b.coins],['收藏',b.saves],['分享',b.shares]])}</dl></section>
        <section><h4>抖音 <a href="${d.url}" target="_blank" rel="noopener">核对原页 ↗</a></h4><p>${d.author} · ${d.published}</p><dl>${cells([['点赞',d.likes],['评论',d.comments],['收藏',d.saves],['分享',d.shares]])}</dl></section></div><p>保留平台显示精度。“万”为近似展示值；播放次数不等于独立人数，两个平台的数据分别列示。未取得后台播放、完播率、转化率或个人贡献比例。</p></details>
      ${e.chapters.length?`<details class="case-source-record"><summary>查看原页章节导航 <span>${e.duration}</span></summary><ol class="case-chapters">${e.chapters.map(([time,label])=>`<li><time>${time}</time><span>${label}</span></li>`).join('')}</ol><p>来自抖音原页标注“内容由 AI 生成”的章节导航，仅用于定位观看，不作为原始脚本或个人制作记录。</p></details>`:''}
    </div>`;
  }
  function toolContent(t) {
    if(t.url) return `<div class="tool-navigation"><p>${t.mode==='online'?'项目和记录保存在原工具中。':t.mode==='hybrid'?'在线预览；下载与解析使用 Mac 本机版。':'在线体验；真实 AI 点评需要本机助手。'}</p>${t.local?`<a href="${safe(t.local)}" target="_blank" rel="noopener">打开本机版 ↗</a>`:''}<a href="${safe(t.url)}" target="_blank" rel="noopener">独立打开 ↗</a></div><iframe class="tool-iframe" title="${safe(t.name)}实际界面" src="${safe(t.url)}" allow="fullscreen; clipboard-write" allowfullscreen></iframe>`;
    return `<div class="local-intro"><div class="icon-art">${icon(toolIcon(t))}</div><h3>${safe(t.summary)}</h3><p>${safe(t.detail)}</p><ol>${t.steps.map(s=>`<li>${safe(s)}</li>`).join('')}</ol><a class="action" href="${safe(t.local)}" target="_blank" rel="noopener">打开本机${safe(t.name)} ↗</a><details><summary>启动说明</summary><p>在装有工具的 Mac 上，先双击「${safe(t.launcher)}」，再打开上方入口。</p><p>${safe(t.note)}</p></details></div>`;
  }

  const details = {};
  projects.forEach(p => { details[`project-${p.id}`] = {title:p.name, body:()=>projectContent(p)}; });
  tools.forEach(t => { details[`tool-${t.id}`] = {title:t.name, body:()=>toolContent(t), tool:!!t.url}; });
  details.site = { title:'关于网站', body:()=>`<div class="window-content site-info"><h3>内容、作品与工具。</h3><p>个人介绍、参与项目与创作工具：刘俊威。</p><p>首页保留四季动效和姓名展示字，网格排版与作品动效参考 <a href="https://wodniack.dev/" target="_blank" rel="noopener">Antoine Wodniack</a>，入场节奏参考 <a href="https://www.ondastudio.co/" target="_blank" rel="noopener">Onda Studio</a>。原桌面交互参考 <a href="https://www.sharyap.com/" target="_blank" rel="noopener">Sharlene Yap</a>。</p><p>场景画面与独立 3D 世界基于 <a href="https://github.com/brunosimon/folio-2025" target="_blank" rel="noopener">Bruno Simon · Folio 2025</a>，保留 <a href="world/BRUNO-LICENSE.md" target="_blank">MIT 许可</a>。姓名字体采用 <a href="https://github.com/TrionesType/zhuque" target="_blank" rel="noopener">朱雀仿宋</a>子集，保留 <a href="assets/fonts/OFL-ZhuqueFangsong.txt" target="_blank">OFL 许可</a>。</p></div>` };
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
