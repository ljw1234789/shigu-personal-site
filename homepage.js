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
  function syncDetailTheme() {
    const paused=document.body.classList.contains('is-paused'),button=dialog.querySelector('[data-detail-motion]');
    if(button){button.textContent=paused?'▷':'Ⅱ';button.setAttribute('aria-label',paused?'播放页面动效':'暂停页面动效');button.setAttribute('aria-pressed',String(paused));}
  }
  new MutationObserver(syncDetailTheme).observe(document.body,{attributes:true,attributeFilter:['class']});
  const featured = ['earth-flat','pizza-slice','life-progress'].map(id=>projects.find(p=>p.id===id));
  const workResults = document.getElementById('work-results');
  if(workResults){workResults.hidden=true;workResults.style.display='none';}
  document.getElementById('case-grid').innerHTML = `<div class="work-intro"><p>毕导 · 精选公开视频</p><span>选题切口 · 内容结构 · 画面表达</span></div>` + featured.map((p,i) => `<a class="case-card" href="#project-${p.id}" data-detail="project-${p.id}" aria-label="查看案例：${p.name}"><div class="case-cover"><img src="assets/projects/${p.id}-hd.jpg" alt="${p.title}" width="1600" height="900" loading="eager"><span class="case-play" aria-hidden="true">▶</span></div><div class="case-copy"><div class="case-topline"><span>${p.type}</span><span class="case-index">0${i+1} / 03</span></div><div class="case-caption"><h3>${p.name}</h3></div><p class="case-summary">${p.copy}</p><div class="case-role-points"><h4>内容拆解</h4><ul>${window.PORTFOLIO_NARRATIVE[p.id].deliverables.map(([label,text])=>`<li><strong>${label}</strong>${text}</li>`).join('')}</ul></div><div class="case-results"><span>B 站 <strong>${evidence.projects[p.id].bilibili.views}</strong> 播放</span><span>抖音 <strong>${evidence.projects[p.id].douyin.likes}</strong> 赞</span></div><span class="case-open-hint">看成片与案例 <b aria-hidden="true">↗</b></span></div></a>`).join('');
  document.getElementById('homepage-tools').innerHTML = tools.filter(t=>t.id==='editor').map(t => `<a class="homepage-tool" href="#tool-${t.id}" data-detail="tool-${t.id}" aria-label="打开${safe(t.name)}"><div class="tool-card-top"><span class="icon-art">${icon(toolIcon(t))}</span></div><h3>${safe(t.name)}</h3><p>${safe(t.detail)}</p><div class="tool-card-bottom"><span>${safe(t.category)}</span><span aria-hidden="true">↗</span></div></a>`).join('');
  function projectContent(p) {
    const e=evidence.projects[p.id], b=e.bilibili, d=e.douyin, narrative=window.PORTFOLIO_NARRATIVE[p.id];
    const cells = list => list.map(([label,value])=>`<div><dt>${safe(label)}</dt><dd>${safe(value)}</dd></div>`).join('');
    return `<div class="window-content evidence-case">
      <div class="section-heading"><div><h3>${p.name}</h3><p>${p.type} · ${p.date} · ${e.duration}</p></div></div>
      <p class="case-role-line"><span>内容重点</span>${safe(e.focus)}</p><p class="case-quick-link"><a href="preview-jordan/?v=interview3#work-${p.id}">快速看成片、拆解与定位片段 ↗</a></p><div class="project-detail"><div class="detail-visual"><div data-player="${p.video}"><button class="detail-poster" data-play="${p.video}" aria-label="播放：${p.title}"><img src="assets/projects/${p.id}-hd.jpg" alt="${p.title}"><span class="play-mark"><span>▶</span></span></button></div><div class="video-actions"><a href="${d.url}" target="_blank" rel="noopener">抖音原片 ↗</a><a href="${b.url}" target="_blank" rel="noopener">B 站原片 ↗</a><button data-stop="${p.video}" hidden>收起播放器</button></div></div>
      <div class="detail-copy"><h3>${p.question}</h3><p>${p.copy}</p>${b.recognition?`<p class="case-recognition">B 站 · ${b.recognition}</p>`:''}<dl class="metrics">${cells([['B 站播放',b.views],['B 站点赞',b.likes],['抖音点赞',d.likes],['抖音分享',d.shares]])}</dl><p class="metric-date">以上为团队作品的公开表现。</p></div></div>
      <section class="case-contribution"><header><p>公开成片</p><h3>内容拆解</h3></header><div class="contribution-grid">${narrative.deliverables.map(([name,text],i)=>`<article><span>0${i+1}</span><h4>${name}</h4><p>${text}</p></article>`).join('')}</div></section>
      <section class="case-reading"><header><p>成片表达分析</p><h3>${e.focus}</h3></header><p class="case-context">${e.context}</p><div class="case-reading-grid">${e.breakdown.map((item,i)=>`<article><span class="case-step">0${i+1}</span><h4>${item.title}</h4><p>${item.text}</p></article>`).join('')}</div></section>
      <figure class="case-evidence-figure"><img src="${e.still.src}" alt="${safe(e.still.caption)}" width="945" height="540" loading="lazy"><figcaption><span>成片截图 · ${e.still.time}</span><span>${e.still.caption}</span></figcaption></figure>
      <section class="case-feedback"><h3>观众反馈与复盘观察</h3><ul>${e.feedback.map(t=>`<li>${t}</li>`).join('')}</ul><p>依据成片内容提出复盘关注点；已采集评论的条目另作说明。</p></section>
      <section class="case-next-step"><h3>下一步，我会怎样改进</h3><p>${narrative.next}</p></section>
      <section class="case-next-step case-research-extension"><h3>继续看，我怎样研究内容</h3><p>这条作品的结构观察、观众反馈与公开数据，也整理进了我的科普内容研究。</p><p><a href="research/#participation">作品研究与原始依据 ↗</a>　<a href="research/bidao/report/">毕导完整 IP 报告 ↗</a></p></section>
      <details class="case-source-record"><summary>查看完整数据与来源 <span>${evidence.checkedAt}</span></summary><div class="platform-records">
        <section><h4>哔哩哔哩 <a href="${b.url}" target="_blank" rel="noopener">核对原页 ↗</a></h4><p>${b.author} · ${b.published}</p><dl>${cells([['播放',b.views],['弹幕',b.danmaku],['点赞',b.likes],['投币',b.coins],['收藏',b.saves],['分享',b.shares]])}</dl></section>
        <section><h4>抖音 <a href="${d.url}" target="_blank" rel="noopener">核对原页 ↗</a></h4><p>${d.author} · ${d.published}</p><dl>${cells([['点赞',d.likes],['评论',d.comments],['收藏',d.saves],['分享',d.shares]])}</dl></section></div><p>保留平台显示精度。“万”为近似展示值；播放次数不等于独立人数，两个平台的数据分别列示。未取得后台播放、完播率、转化率或个人贡献比例。</p></details>
      ${e.chapters.length?`<details class="case-source-record"><summary>查看原页章节导航 <span>${e.duration}</span></summary><ol class="case-chapters">${e.chapters.map(([time,label])=>`<li><time>${time}</time><span>${label}</span></li>`).join('')}</ol><p>来自抖音原页标注“内容由 AI 生成”的章节导航，仅用于定位观看，不作为原始脚本或个人制作记录。</p></details>`:''}
    </div>`;
  }
  function toolContent(t) { return window.ToolPresentation.render(t,icon(toolIcon(t))); }

  const details = {};
  projects.forEach(p => { details[`project-${p.id}`] = {title:p.name, body:()=>projectContent(p)}; });
  tools.forEach(t => { details[`tool-${t.id}`] = {title:t.name, body:()=>toolContent(t), tool:true}; });
  details.site = { title:'关于网站', body:()=>`<div class="window-content site-info"><h3>内容、作品与工具。</h3><p>个人介绍、视频精选与创作工具：刘俊威。</p><p>首页的立体字质感、云状光影和版式参考 <a href="https://haoqi.design/" target="_blank" rel="noopener">Haoqi Design</a>。姓名立体字基于<a href="https://github.com/CyanoHao/Resource-Han-Rounded" target="_blank" rel="noopener">资源圆体</a>重新建模，保留<a href="assets/fonts/OFL-ResourceHanRounded.txt" target="_blank">资源圆体 OFL 许可</a>。结尾使用 Fredoka。早期字形保留 <a href="assets/fonts/OFL-LXGWWenKai.txt" target="_blank">霞鹜文楷</a> 与 <a href="assets/fonts/OFL-Fredoka.txt" target="_blank">Fredoka</a> 的 OFL 许可。早期网格排版与作品动效参考 <a href="https://wodniack.dev/" target="_blank" rel="noopener">Antoine Wodniack</a>，入场节奏参考 <a href="https://www.ondastudio.co/" target="_blank" rel="noopener">Onda Studio</a>。原桌面交互参考 <a href="https://www.sharyap.com/" target="_blank" rel="noopener">Sharlene Yap</a>。</p><p>场景画面与独立 3D 世界基于 <a href="https://github.com/brunosimon/folio-2025" target="_blank" rel="noopener">Bruno Simon · Folio 2025</a>，保留 <a href="world/BRUNO-LICENSE.md" target="_blank">MIT 许可</a>。圆润立体姓名基于 <a href="https://github.com/lxgw/LxgwWenKai" target="_blank" rel="noopener">霞鹜文楷</a>构建，保留 <a href="assets/fonts/OFL-LXGWWenKai.txt" target="_blank">OFL 许可</a>。导航姓名采用 <a href="https://github.com/TrionesType/zhuque" target="_blank" rel="noopener">朱雀仿宋</a>子集，保留 <a href="assets/fonts/OFL-ZhuqueFangsong.txt" target="_blank">OFL 许可</a>。</p></div>` };
  function stopCaseMedia() {
    content.querySelectorAll('video').forEach(media=>{media.pause();media.removeAttribute('src');media.load();});
  }
  function openDetail(id, push = true, trigger = null) {
    const detail = details[id]; if (!detail) return;
    if (current === id && dialog.open) return;
    if (!dialog.open) {
      returnFocus = trigger || document.activeElement;
      baseHash = Object.hasOwn(details, location.hash.slice(1)) ? (id.startsWith('project-')?'#projects':id.startsWith('tool-')?'#tools':'') : location.hash;
    }
    stopCaseMedia(); current = id; heading.textContent = detail.title;
    const project = id.startsWith('project-');
    dialog.classList.toggle('is-project-detail',project);
    dialog.querySelector('.detail-close').textContent = project ? '← 返回作品' : id.startsWith('tool-') ? '← 返回工具' : '×';
    dialog.querySelector('.detail-close').setAttribute('aria-label',project ? '返回作品' : id.startsWith('tool-') ? '返回工具' : '关闭详情');
    dialog.classList.toggle('is-tool-detail', Boolean(detail.tool));
    content.className = `detail-content${detail.tool?' tool-body':''}`;
    content.innerHTML = detail.body(); content.scrollTop = 0;
    document.body.classList.add('detail-open');
    if (!dialog.open) dialog.showModal();
    if(project) requestAnimationFrame(syncDetailTheme);
    if (push) history.pushState({detailOverlay:true}, '', `${location.pathname}${location.search}#${id}`);
    heading.focus({preventScroll:true});
  }
  function closeDetail(route = true) {
    if (!dialog.open) return;
    if (route && history.state?.detailOverlay) { history.back(); return; }
    stopCaseMedia(); dialog.close(); content.replaceChildren(); current = '';
    document.body.classList.remove('detail-open');
    if (route) history.replaceState(null, '', `${location.pathname}${location.search}${baseHash}`);
    if (returnFocus?.isConnected && returnFocus !== document.body) returnFocus.focus({preventScroll:true});
    else if(baseHash === '#projects') document.getElementById('projects').scrollIntoView({behavior:'instant'});
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
    if(event.target.closest('[data-detail-motion]')) { document.getElementById('motion-toggle').click(); return; }
    const link = event.target.closest('[data-detail]');
    if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); openDetail(link.dataset.detail,true,link); return; }
    const play = event.target.closest('[data-play]');
    if (play) {
      const p=projects.find(p=>p.video===play.dataset.play); if(!p)return;
      stopCaseMedia();
      const player=play.parentElement,media=document.createElement('video'),status=document.createElement('p');
      media.className='video-frame';media.controls=true;media.playsInline=true;media.preload='metadata';
      media.poster='assets/projects/'+p.id+'-hd.jpg';media.src='preview-jordan/media/'+p.id+'.mp4';media.setAttribute('aria-label',p.name+'完整视频');
      player.classList.add('case-native-player');status.className='case-native-status';status.setAttribute('role','status');status.textContent='正在载入完整视频…';
      media.addEventListener('playing',()=>{status.hidden=true;});
      media.addEventListener('waiting',()=>{status.textContent='正在缓冲…';status.hidden=false;});
      media.addEventListener('error',()=>{status.innerHTML='视频暂时未能载入。<button type="button" data-native-retry>重试播放 ↻</button>，也可打开下方 B 站原片。';status.hidden=false;});
      player.replaceChildren(media,status);content.querySelector('[data-stop]').hidden=false;
      // Keep play() in the initiating click so browsers retain the user gesture.
      media.play().catch(()=>{if(!media.error){status.innerHTML='<button type="button" data-native-retry>点击播放 ▷</button>';status.hidden=false;}});return;
    }
    if(event.target.closest('[data-native-retry]')){
      const media=content.querySelector('video');if(media){if(media.error)media.load();media.play().catch(()=>{});}return;
    }
    if (event.target.closest('[data-stop]')) { const detail=details[current]; if(detail){stopCaseMedia();content.innerHTML=detail.body();} return; }
    if (event.target.closest('[data-copy-site]')) {
      try { await navigator.clipboard.writeText('https://ljw1234789.github.io/shigu-personal-site/?v=viral-20261105'); showToast('网站链接已复制'); }
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
  function setMotion(paused){document.body.classList.toggle('is-paused',paused);motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'动态 [▷]':'动态 [Ⅱ]';motion.setAttribute('aria-label',paused?'播放页面动效':'暂停页面动效');motion.title=motion.getAttribute('aria-label');}
  setMotion(reduced.matches);motion.addEventListener('click',()=>setMotion(!document.body.classList.contains('is-paused')));reduced.addEventListener('change',event=>setMotion(event.matches));
  let pointerFrame=0;
  document.addEventListener('pointermove',event=>{
    if(reduced.matches||document.body.classList.contains('is-paused')||event.pointerType==='touch'||pointerFrame)return;
    pointerFrame=requestAnimationFrame(()=>{document.documentElement.style.setProperty('--px',`${(event.clientX/innerWidth-.5)*14}px`);document.documentElement.style.setProperty('--py',`${(event.clientY/innerHeight-.5)*12}px`);pointerFrame=0;});
  },{passive:true});
  addEventListener('popstate',route);addEventListener('hashchange',route);
  route();
})();
