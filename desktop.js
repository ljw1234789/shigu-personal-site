(() => {
  'use strict';
  const desktop = document.getElementById('desktop');
  const host = document.getElementById('windows');
  const dock = document.getElementById('dock');
  const mobile = window.matchMedia('(max-width: 700px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tools = window.CREATIVE_TOOLS || [];
  const windows = new Map();
  let z = 10, active = '', audio = null, sound = false, toastTimer;
  const safe = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons = {
    home:'<path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 47.06%)" d="m10 39 34-27 32 27v32L43 84 10 69Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 84.71%)" d="m10 36 34-26 32 26-10 5-22-17-23 19Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 65.1%)" d="m21 42 23-18 22 17v28L44 80 21 66Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 44.31%)" d="m44 24 22 17v28L44 80Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 83.53%)" d="M33 48h14v28l-14-7Z"/>',
    about:'<path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 41.18%)" d="m19 12 47-3 13 11v58L31 87 17 74Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 70.2%)" d="m17 9 46-3 3 68-49 9Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 54.9%)" d="m66 74 13 4V20L63 6Z"/><circle cx="40" cy="31" r="10" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 89.02%)"/><path d="M25 60q0-16 15-16t15 14Z" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 82.75%)"/><path d="m26 69 27-4" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 41.18%)" stroke-width="3"/>',
    folder:'<path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 49.8%)" d="m9 23 29-4 9 7 30-1 6 47-65 15Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 88.63%)" d="m25 21 43-10 7 49-44 12Z"/><path d="m35 29 24-5m-22 14 24-5m-22 14 21-5" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 59.22%)" stroke-width="3"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 70.59%)" d="m7 36 66-8-8 48L18 87Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 55.29%)" d="m73 28 11 10-6 43-60 6 47-11Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 84.71%)" d="m7 36 66-8-2 10-61 9Z"/>',
    toolbox:'<path fill="none" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 53.33%)" stroke-width="8" d="M29 32V16l24-4 9 7v13"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 74.9%)" d="m10 32 50-10 22 14-51 12Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 58.04%)" d="m10 32 21 16v35L10 65Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 47.84%)" d="m31 48 51-12v35L31 83Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 78.82%)" d="m10 32 21 16 51-12v11L31 59 10 43Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 89.02%)" d="m49 48 12-3v15l-12 3Z"/>',
    notes:'<path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 49.8%)" d="m19 10 47-3 13 12v57L31 86 19 72Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 89.8%)" d="m15 11 48-5 3 68-48 10Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 73.73%)" d="m63 6 16 13v57l-13-2Z"/><path d="m27 28 25-3m-24 16 25-3m-24 16 18-2m-17 15 24-3" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 52.94%)" stroke-width="3"/><path d="m60 20 9 5-25 44-10 4 1-11Z" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 59.22%)"/><path d="m60 20 9 5 3-6-9-5Z" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 64.31%)"/>',
    links:'<path d="m31 52-7 7a13 13 0 0 0 18 18l16-16a13 13 0 0 0-1-19M50 36l7-7a13 13 0 0 0-18-18L23 27a13 13 0 0 0 1 19" fill="none" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 41.18%)" stroke-width="15" transform="translate(7 7)"/><path d="m31 52-7 7a13 13 0 0 0 18 18l16-16a13 13 0 0 0-1-19M50 36l7-7a13 13 0 0 0-18-18L23 27a13 13 0 0 0 1 19" fill="none" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 74.51%)" stroke-width="12"/><path d="m31 50 18-18" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 89.41%)" stroke-width="9" stroke-linecap="round"/>',
    car:'<ellipse cx="45" cy="77" rx="35" ry="8" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 21.18%)"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 52.94%)" d="m9 43 17-9 5-18 28-5 14 17 8 8v27L28 79 9 63Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 77.65%)" d="m9 43 26 12 46-19-22-8-33 6Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 47.06%)" d="m35 55 46-19v27L28 79 9 63V48Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 25.49%)" d="m32 19 24-4 11 15-35 12Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 65.88%)" d="m35 22 18-3 5 7-23 8Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 25.1%)" d="m20 35 11-16v22l-11 5Z"/><ellipse cx="25" cy="70" rx="8" ry="11" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 15.69%)"/><ellipse cx="65" cy="65" rx="8" ry="11" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 15.69%)"/><ellipse cx="27" cy="70" rx="3" ry="6" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 53.33%)"/><ellipse cx="67" cy="65" rx="3" ry="6" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 53.33%)"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 88.24%)" d="m39 57 12-4v7l-12 4Zm28-11 10-4v7l-10 4Z"/>',
    science:'<path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 52.55%)" d="m10 19 49-7 17 12v37l-49 14L10 61Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 74.9%)" d="m10 19 48-7 2 43-15 3-17 17-1-13-17-1Z"/><path d="m21 30 27-4m-26 15 20-3" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 45.1%)" stroke-width="4"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 78.43%)" d="m41 45 37-7 4 30-13 2-9 12-3-10-16 1Z"/><path d="m48 54 24-4m-23 13 17-3" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 47.84%)" stroke-width="3"/>',
    voice:'<path d="M34 52v15l14 7 17-8" fill="none" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 64.71%)" stroke-width="7"/><path d="M22 32v15q0 20 23 19t23-23V28" fill="none" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 49.41%)" stroke-width="6"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 65.1%)" d="M31 20q0-13 14-15t14 12v26q0 14-14 16T31 47Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 78.82%)" d="M31 20q0-13 14-15v54q-14 2-14-12Z"/><path d="m35 21 17-2m-17 12 17-2m-17 12 17-2" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 45.49%)" stroke-width="3"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 77.25%)" d="m31 73 17-4 17 8-17 5-17-4Z"/>',
    editor:'<path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 47.45%)" d="m10 20 56-10 14 12v46L25 82 10 68Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 72.16%)" d="m10 20 56-10v49L10 70Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 27.06%)" d="m17 27 41-8v31l-41 9Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 85.1%)" d="m32 29 17 7-17 13Z"/><path d="m17 63 41-9" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 56.08%)" stroke-width="3"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 85.49%)" d="m36 72 15-4v4l13 5-25 6-14-7Z"/>',
    motion:'<path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 51.37%)" d="m36 12 40 28-4 14-40 31Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 77.65%)" d="m32 5 40 33-40 38Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 63.92%)" d="m32 5 40 33 4 12-44 35V76l40-38Z"/><path d="M8 25h14M3 42h19M9 59h13" stroke="hsl(var(--season-hue,0) var(--icon-saturation,0%) 73.33%)" stroke-width="5" stroke-linecap="round"/>',
    photo:'<path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 54.51%)" d="m8 32 17-4 6-12 25-4 9 9 17 8v36L31 83 8 68Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 74.9%)" d="m8 32 45-9 20 10-43 12Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 59.22%)" d="m30 45 43-12v38L30 83Z"/><path fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 74.12%)" d="m8 32 22 13v38L8 68Z"/><ellipse cx="49" cy="57" rx="16" ry="18" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 33.73%)"/><ellipse cx="50" cy="55" rx="10" ry="12" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 54.9%)"/><ellipse cx="52" cy="53" rx="6" ry="8" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 83.14%)"/><path d="m60 34 8-2v5l-8 3Z" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 88.63%)"/>'
  };
  const icon = (key) => `<svg viewBox="0 0 90 90" aria-hidden="true">${icons[key] || icons.folder}</svg>`;
  const toolIcon = tool => tool.id === 'batch' ? 'folder' : tool.id;
  const projects = [
    {id:'behind',name:'一条视频的诞生',title:'首次公开！揭秘毕导视频制作全过程',date:'2025.09.13',type:'幕后制作',image:'behind-scenes',video:'7549017187839741224',likes:'7.3 万',comments:'791',saves:'5,031',shares:'1,074',question:'怎样让幕后故事，也值得被看见？',copy:'把一条科普视频从灵感到成片的过程，变成观众能跟着走的故事。'},
    {id:'coastline',name:'丈量一条海岸线',title:'这条线看得清摸得着，但你永远测不出它的长度',date:'2026.02.11',type:'分形与自然',image:'coastline',video:'7605293710498254126',likes:'20.0 万',comments:'3,143',saves:'2.4 万',shares:'2.3 万',question:'看得见的海岸线，为什么量不完？',copy:'用真实海岸线与测量尺度的变化，把抽象的分形问题放进具体情境。'},
    {id:'dry-ice',name:'重新认识干冰白雾',title:'这个现象你肯定见过，但初中教材上的解释几乎都是错的',date:'2026.03.27',type:'物理科普',image:'dry-ice',video:'7621787772751285519',likes:'51.2 万',comments:'9,942',saves:'9.6 万',shares:'8.6 万',question:'熟悉的现象，解释一定对吗？',copy:'从干冰周围的白雾出发，把容易混淆的现象与概念拆开讲。'}
  ];
  const applications = [
    ['about','关于我','about'],['projects','视频作品','folder'],['tools','创作工具','toolbox'],['experience','工作经历','notes'],['links','网站入口','links']
  ];
  function homeContent() {
    return `<div class="home-intro"><div class="hello">你好，我是</div><h1>刘俊威<span> .</span></h1><p>一个工科背景的内容创作者。<br>用 AI 做内容，也把想法做成工具。</p><svg class="home-flower" viewBox="0 0 100 100" aria-hidden="true"><path fill="currentColor" d="m50 0 9 29 26-15-15 27 30 9-30 9 15 27-26-15-9 29-9-29-26 15 15-27L0 50l30-9-15-27 26 15Z"/><circle cx="50" cy="50" r="13" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 22.75%)"/><circle cx="50" cy="50" r="6" fill="hsl(var(--season-hue,0) var(--icon-saturation,0%) 83.53%)"/></svg></div><div class="home-divider"></div><nav class="home-icons" aria-label="认识刘俊威">${applications.map(([id,label,art])=>`<button class="app-icon" data-open="${id}"><span class="icon-art">${icon(art)}</span><span>${label}</span></button>`).join('')}</nav>`;
  }
  function aboutContent() {
    return `<div class="window-content"><div class="about-lead"><div class="personal-monogram" aria-hidden="true">刘</div><div><h3>刘俊威</h3><p>工科背景 · 内容创作者<br>选题、脚本、剪辑与 AI 小工具</p></div></div><div class="prose"><p>我曾在<strong>毕导团队</strong>参与科普视频制作，用 AI 辅助选题和写脚本，也做剪辑、发布与复盘。</p><p>现在，我也把创作中反复遇到的问题做成小工具。从选题、素材到配音和剪辑，让想法更快落到作品里。</p><p>工科背景，让我习惯从现象追到原理。做内容，则需要再向观众走一步。</p></div><div class="skill-tags"><span>AI 辅助选题</span><span>脚本撰写</span><span>视频剪辑</span><span>发布复盘</span></div><div class="window-callout"><span>先想明白，再讲明白。</span><button class="action" data-open="projects">看看我参与的作品 ↗</button></div></div>`;
  }
  function projectsContent() {
    return `<div class="window-content"><div class="section-heading"><div><h3>从一个问题，到一条成片。</h3><p>毕导团队 · 我参与的三个项目</p></div><a class="quiet-link" href="portfolio.html#cases" target="_blank" rel="noopener">完整作品集 ↗</a></div><div class="project-grid">${projects.map(p=>`<button class="project-card" data-open="project-${p.id}" aria-label="查看作品：${p.name}"><span class="project-image"><img src="assets/projects/${p.image}.jpg" alt="${p.title}" width="440" height="330"><span class="play-mark"><span>▶</span></span></span><small>${p.type} · ${p.date}</small><h4>${p.name}</h4><span class="project-like">♡ ${p.likes} 点赞</span></button>`).join('')}</div><div class="project-bottom"><span>选题 → 脚本 → 剪辑 → 发布复盘</span><span>抖音公开互动数据 · 截至 2026.10.14</span></div></div>`;
  }
  function projectContent(p) {
    return `<div class="window-content"><div class="section-heading"><div><h3>${p.name}</h3><p>${p.type} · ${p.date}</p></div></div><div class="project-detail"><div class="detail-visual"><div data-player="${p.video}"><button class="detail-poster" data-play="${p.video}" aria-label="播放：${p.title}"><img src="assets/projects/${p.image}.jpg" alt="${p.title}"><span class="play-mark"><span>▶</span></span></button></div><div class="video-actions"><a href="https://www.douyin.com/video/${p.video}" target="_blank" rel="noopener">在抖音看原片 ↗</a><button data-stop="${p.video}" hidden>收起播放器</button></div></div><div class="detail-copy"><h3>${p.question}</h3><p>${p.copy}</p><dl class="metrics">${[['点赞',p.likes],['评论',p.comments],['收藏',p.saves],['分享',p.shares]].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><p class="metric-date">抖音公开互动数据 · 截至 2026.10.14</p><div class="responsibility"><h4>我参与的工作</h4><p>AI 辅助选题、脚本撰写、视频剪辑，以及发布后的评论反馈整理与复盘。</p><a class="quiet-link" href="portfolio.html#project-${projects.indexOf(p)+1}" target="_blank" rel="noopener">查看完整项目说明 ↗</a></div></div></div></div>`;
  }
  function toolsContent() {
    return `<div class="window-content"><div class="section-heading"><div><h3>创作工具箱</h3><p>把选题、素材、声音和画面接起来。</p></div><a class="quiet-link" href="tools.html" target="_blank" rel="noopener">独立工作台 ↗</a></div><div class="tool-grid">${tools.map(t=>`<button class="tool-tile" data-open="tool-${t.id}"><span class="icon-art">${icon(toolIcon(t))}</span><h4>${safe(t.name)}</h4><p>${safe(t.summary)}</p><small>${safe(t.badge)}</small></button>`).join('')}</div></div>`;
  }
  function toolContent(t) {
    if(t.url) return `<div class="tool-navigation"><p>${t.mode==='online'?'项目和记录保存在原工具中。':t.mode==='hybrid'?'在线预览；下载与解析使用 Mac 本机版。':'在线体验；真实 AI 点评需要本机助手。'}</p>${t.local?`<a href="${safe(t.local)}" target="_blank" rel="noopener">打开本机版 ↗</a>`:''}<a href="${safe(t.url)}" target="_blank" rel="noopener">独立打开 ↗</a></div><iframe class="tool-iframe" title="${safe(t.name)}实际界面" src="${safe(t.url)}" allow="fullscreen; clipboard-write" allowfullscreen></iframe>`;
    return `<div class="local-intro"><div class="icon-art">${icon(toolIcon(t))}</div><h3>${safe(t.summary)}</h3><p>${safe(t.detail)}</p><ol>${t.steps.map(s=>`<li>${safe(s)}</li>`).join('')}</ol><a class="action" href="${safe(t.local)}" target="_blank" rel="noopener">打开本机${safe(t.name)} ↗</a><details><summary>启动说明</summary><p>在装有工具的 Mac 上，先双击「${safe(t.launcher)}」，再打开上方入口。</p><p>${safe(t.note)}</p></details></div>`;
  }
  function experienceContent() {
    const steps=[['AI 辅助选题','从熟悉的现象和观众的问题里，找到值得展开的切入点。'],['脚本撰写','把资料整理成讲述顺序，让观众能跟着思路理解问题。'],['视频剪辑','让画面、字幕和旁白互相对应，把抽象的概念讲得具体。'],['发布与复盘','整理发布内容，回看评论反馈，找到下一次可以改进的地方。']];
    return `<div class="window-content"><h3 class="experience-name">毕导团队</h3><p class="experience-role">科普视频内容创作</p><ol class="timeline">${steps.map(([title,copy],i)=>`<li><span>0${i+1}</span><div><h4>${title}</h4><p>${copy}</p></div></li>`).join('')}</ol><button class="action" data-open="projects">打开参与项目 ↗</button></div>`;
  }
  function linksContent() {
    return `<div class="window-content"><div class="section-heading"><div><h3>从这里继续。</h3><p>作品、工具，以及我的另一个小世界。</p></div></div><div class="link-list"><a class="link-row" href="portfolio.html" target="_blank" rel="noopener"><div><strong>完整作品集</strong><p>项目、职责与公开数据</p></div><span>↗</span></a><a class="link-row" href="tools.html" target="_blank" rel="noopener"><div><strong>创作工具箱</strong><p>六个工具，独立工作台</p></div><span>↗</span></a><a class="link-row" href="world/index.html" target="_blank" rel="noopener"><div><strong>去岛上逛逛</strong><p>开一辆小车，探索我的 3D 创作世界</p></div><span>↗</span></a></div><div class="window-callout"><span>把我的网站分享给别人。</span><button class="action" data-copy-site>复制网站链接</button></div></div>`;
  }
  const configs = {
    home:{title:'刘俊威 · 个人主页',icon:'home',width:790,height:505,body:homeContent,bodyClass:'home-body',footer:'<span>内容创作 · AI 工具</span><button data-open="projects">先看作品 ↗</button>'},
    about:{title:'关于我',icon:'about',width:660,height:620,body:aboutContent},
    projects:{title:'视频作品',icon:'folder',width:900,height:560,body:projectsContent},
    tools:{title:'创作工具',icon:'toolbox',width:820,height:655,body:toolsContent},
    experience:{title:'工作经历',icon:'notes',width:630,height:640,body:experienceContent},
    links:{title:'网站入口',icon:'links',width:590,height:570,body:linksContent},
    site:{title:'关于网站',icon:'home',width:580,height:465,body:()=>`<div class="window-content site-info"><h3>一个可以打开的创作桌面。</h3><p>桌面与窗口交互参考 <a href="https://www.sharyap.com/" target="_blank" rel="noopener">Sharlene Yap</a>，以自己的内容与图标重新实现。</p><p>场景画面和独立 3D 世界基于 <a href="https://github.com/brunosimon/folio-2025" target="_blank" rel="noopener">Bruno Simon · Folio 2025</a>。保留原作的暖橙、紫色阴影与立体氛围。</p><p>个人介绍、参与项目与创作工具：刘俊威。<br><a href="world/BRUNO-LICENSE.md" target="_blank">查看原作 MIT 许可 ↗</a></p><div class="actions"><button class="action secondary" data-copy-site>复制网站链接</button></div></div>`}
  };
  for(const p of projects) configs[`project-${p.id}`]={title:p.name,icon:'folder',width:930,height:650,body:()=>projectContent(p)};
  for(const t of tools) configs[`tool-${t.id}`]={title:t.name,icon:toolIcon(t),width:t.url?Math.min(1260,innerWidth-70):650,height:t.url?desktop.clientHeight-30:650,body:()=>toolContent(t),bodyClass:t.url?'tool-body':''};
  function playSound() {
    if(!sound)return;
    try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(540,audio.currentTime);o.frequency.exponentialRampToValueAtTime(820,audio.currentTime+.07);g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.13);}catch{}
  }
  function renderDock(){
    dock.innerHTML=[...windows].map(([id,w])=>`<button class="dock-button ${id===active&&!w.el.hidden?'active':''} ${w.el.hidden?'is-minimized':''}" data-dock="${id}" title="${safe(w.config.title)}" aria-label="${safe(w.config.title)}" aria-pressed="${id===active&&!w.el.hidden}">${icon(w.config.icon)}</button>`).join('');
  }
  function focusWindow(id,keyboard=false){
    const w=windows.get(id);if(!w)return;w.el.hidden=false;w.el.style.zIndex=++z;active=id;
    windows.forEach((v,k)=>v.el.classList.toggle('is-active',k===id));renderDock();
    if(keyboard)w.el.querySelector('h2').focus({preventScroll:true});
  }
  function topWindow(){return [...windows].filter(([,w])=>!w.el.hidden).sort((a,b)=>Number(b[1].el.style.zIndex)-Number(a[1].el.style.zIndex))[0]?.[0];}
  function stopVideo(w){
    w.el.querySelectorAll('[data-player]').forEach(p=>{const project=projects.find(item=>item.video===p.dataset.player);if(project&&p.querySelector('iframe')){p.innerHTML=`<button class="detail-poster" data-play="${project.video}" aria-label="播放：${project.title}"><img src="assets/projects/${project.image}.jpg" alt="${project.title}"><span class="play-mark"><span>▶</span></span></button>`;w.el.querySelector('[data-stop]').hidden=true;}});
  }
  function closeWindow(id){const w=windows.get(id);if(!w)return;w.el.remove();windows.delete(id);const top=topWindow();active=top||'';if(top)focusWindow(top,true);else document.querySelector('.desktop-brand').focus();renderDock();syncHash(top);playSound();}
  function minimize(id){const w=windows.get(id);if(!w)return;stopVideo(w);w.el.hidden=true;const top=topWindow();active=top||'';if(top)focusWindow(top);renderDock();syncHash(top);}
  function maximize(w){w.el.classList.toggle('is-maximized');const button=w.el.querySelector('.maximize-window');button.setAttribute('aria-label',w.el.classList.contains('is-maximized')?'还原窗口':'最大化窗口');button.title=button.getAttribute('aria-label');}
  function syncHash(id){const hash=id&&id!=='home'?`#${id}`:'';history.replaceState(null,'',`${location.pathname}${location.search}${hash}`);}
  function placeWindow(el,id,config){
    const width=Math.min(config.width,desktop.clientWidth-48),height=Math.min(config.height,desktop.clientHeight-28);
    const offset=id==='home'?-65:(windows.size%4)*20;
    const left=Math.max(18,Math.min(desktop.clientWidth-width-18,(desktop.clientWidth-width)/2+offset));
    const top=Math.max(14,Math.min(desktop.clientHeight-height-14,(desktop.clientHeight-height)/2+(id==='home'?-20:(windows.size%3)*15)));
    Object.assign(el.style,{width:`${width}px`,height:`${height}px`,left:`${left}px`,top:`${top}px`});
  }
  function bindMove(w){
    const bar=w.el.querySelector('.window-titlebar'),grip=w.el.querySelector('.window-grip');
    const start=(event,resizing)=>{
      if(mobile.matches||event.button!==0||event.target.closest('button')||w.el.classList.contains('is-maximized'))return;
      event.preventDefault();focusWindow(w.id);const handle=resizing?grip:bar;handle.setPointerCapture(event.pointerId);
      const x=event.clientX,y=event.clientY,left=w.el.offsetLeft,top=w.el.offsetTop,width=w.el.offsetWidth,height=w.el.offsetHeight;
      w.el.classList.add('is-dragging');document.body.classList.add('is-dragging');
      const move=e=>{const dx=e.clientX-x,dy=e.clientY-y;if(resizing){w.el.style.width=`${Math.max(340,Math.min(desktop.clientWidth-left-10,width+dx))}px`;w.el.style.height=`${Math.max(220,Math.min(desktop.clientHeight-top-8,height+dy))}px`;}else{w.el.style.left=`${Math.max(0,Math.min(desktop.clientWidth-w.el.offsetWidth,left+dx))}px`;w.el.style.top=`${Math.max(0,Math.min(desktop.clientHeight-90,top+dy))}px`;}};
      const end=()=>{w.el.classList.remove('is-dragging');document.body.classList.remove('is-dragging');handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);};
      handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
    };
    bar.addEventListener('pointerdown',e=>start(e,false));grip.addEventListener('pointerdown',e=>start(e,true));bar.addEventListener('dblclick',e=>{if(!mobile.matches&&!e.target.closest('button'))maximize(w);});
  }
  function openWindow(id,{focus=true,route=true}={}){
    const config=configs[id];if(!config)return;
    if(windows.has(id)){focusWindow(id,focus);if(route)syncHash(id);return;}
    const el=document.createElement('section');el.className=`window ${id==='home'?'home-window':''}`;el.dataset.window=id;el.setAttribute('role','region');el.setAttribute('aria-labelledby',`title-${id}`);
    el.innerHTML=`<header class="window-titlebar"><h2 id="title-${id}" tabindex="-1">${icon(config.icon)}${safe(config.title)}</h2><div class="window-controls"><button class="minimize-window" aria-label="最小化窗口" title="最小化">−</button><button class="maximize-window" aria-label="最大化窗口" title="最大化">□</button><button class="close-window" aria-label="关闭${safe(config.title)}" title="关闭">×</button></div></header><div class="window-body ${config.bodyClass||''}">${config.body()}</div>${config.footer?`<footer class="window-footer">${config.footer}</footer>`:''}<div class="window-grip" aria-hidden="true"></div>`;
    const w={el,config,id};placeWindow(el,id,config);windows.set(id,w);host.appendChild(el);bindMove(w);
    el.addEventListener('pointerdown',()=>{if(active!==id)focusWindow(id);});
    el.querySelector('.close-window').addEventListener('click',()=>closeWindow(id));el.querySelector('.minimize-window').addEventListener('click',()=>minimize(id));el.querySelector('.maximize-window').addEventListener('click',()=>maximize(w));
    focusWindow(id,focus);if(route)syncHash(id);playSound();
  }
  function notify(message){const el=document.getElementById('desktop-status');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3000);}
  document.addEventListener('click',async event=>{
    const open=event.target.closest('[data-open]');if(open){openWindow(open.dataset.open);return;}
    const d=event.target.closest('[data-dock]');if(d){const id=d.dataset.dock;if(active===id&&!windows.get(id).el.hidden)minimize(id);else{focusWindow(id,true);syncHash(id);}return;}
    const play=event.target.closest('[data-play]');if(play){const p=projects.find(item=>item.video===play.dataset.play);if(!p)return;const frame=document.createElement('iframe');frame.className='video-frame';frame.title=p.title;frame.src=`https://open.douyin.com/player/video?vid=${p.video}&autoplay=0`;frame.allow='fullscreen; autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='unsafe-url';play.parentElement.replaceChildren(frame);windows.get(`project-${p.id}`).el.querySelector('[data-stop]').hidden=false;return;}
    const stop=event.target.closest('[data-stop]');if(stop){const p=projects.find(item=>item.video===stop.dataset.stop);stopVideo(windows.get(`project-${p.id}`));return;}
    if(event.target.closest('[data-copy-site]')){try{await navigator.clipboard.writeText('https://ljw1234789.github.io/shigu-personal-site/');notify('网站链接已复制');}catch{notify('可复制浏览器地址栏中的网站链接');}}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active&&!e.target.matches('input,textarea,[contenteditable=true]'))closeWindow(active);});
  const motionButton=document.getElementById('motion-toggle');
  function setMotion(paused){document.body.classList.toggle('is-paused',paused);motionButton.setAttribute('aria-pressed',String(paused));motionButton.textContent=paused?'▷':'Ⅱ';motionButton.setAttribute('aria-label',paused?'播放桌面动态':'暂停桌面动态');motionButton.title=motionButton.getAttribute('aria-label');}
  setMotion(reduced.matches);motionButton.addEventListener('click',()=>setMotion(!document.body.classList.contains('is-paused')));reduced.addEventListener('change',e=>setMotion(e.matches));
  document.getElementById('sound-toggle').addEventListener('click',e=>{sound=!sound;e.currentTarget.setAttribute('aria-pressed',String(sound));e.currentTarget.setAttribute('aria-label',sound?'关闭交互音效':'开启交互音效');e.currentTarget.title=e.currentTarget.getAttribute('aria-label');playSound();});
  document.getElementById('desktop-toggle').addEventListener('click',()=>{const visible=[...windows].filter(([,w])=>!w.el.hidden);if(visible.length){for(const [id]of visible)minimize(id);}else openWindow('home');});
  document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
  let pointerFrame=0;
  document.addEventListener('pointermove',event=>{if(reduced.matches||document.body.classList.contains('is-paused')||event.pointerType==='touch')return;if(pointerFrame)return;pointerFrame=requestAnimationFrame(()=>{document.documentElement.style.setProperty('--px',`${(event.clientX/innerWidth-.5)*22}px`);document.documentElement.style.setProperty('--py',`${(event.clientY/innerHeight-.5)*17}px`);pointerFrame=0;});},{passive:true});
  const updateClock=()=>{const now=new Date();document.getElementById('desktop-time').textContent=now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});};updateClock();setInterval(updateClock,30000);
  mobile.addEventListener('change',()=>{if(!mobile.matches)windows.forEach(w=>placeWindow(w.el,w.id,w.config));});
  addEventListener('resize',()=>{if(!mobile.matches)windows.forEach(w=>{if(w.el.classList.contains('is-maximized'))return;w.el.style.width=`${Math.min(w.el.offsetWidth,desktop.clientWidth-30)}px`;w.el.style.height=`${Math.min(w.el.offsetHeight,desktop.clientHeight-20)}px`;w.el.style.left=`${Math.max(10,Math.min(w.el.offsetLeft,desktop.clientWidth-w.el.offsetWidth-10))}px`;w.el.style.top=`${Math.max(10,Math.min(w.el.offsetTop,desktop.clientHeight-80))}px`;});});
  function fromHash(){const old={cases:'projects',showcase:'projects',myProjects:'projects',myTools:'tools',intro:'about'};const hash=location.hash.slice(1);const id=old[hash]||hash;if(configs[id])openWindow(id,{route:false});}
  openWindow('home',{focus:false,route:false});fromHash();addEventListener('hashchange',fromHash);
})();
