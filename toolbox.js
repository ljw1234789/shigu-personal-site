(() => {
  'use strict';
  const tools = window.CREATIVE_TOOLS || [];
  const icons = {
    science: '<path d="M18 16h29v24H30l-12 9V16Z"/><path d="M34 36h28v24l-11-8H34V36Z"/><path d="M26 25h13M42 44h11"/>',
    batch: '<rect x="15" y="26" width="38" height="30" rx="3"/><path d="M23 19h38v30M31 12h38v30M24 47l8-8 8 8 6-6M24 34h1"/>',
    voice: '<path d="M12 36v8m8-18v28m8-37v46m8-52v58m8-46v34m8-24v14m8-27v40m8-29v18"/>',
    editor: '<rect x="12" y="12" width="56" height="36" rx="3"/><path d="m35 23 13 7-13 7V23ZM12 59h23m6 0h27M12 68h12m6 0h38M53 53v21"/>',
    motion: '<path d="m34 12 30 28-30 28V12ZM10 26h16M6 40h20m-16 14h16"/>',
    photo: '<path d="M25 16h30l5 8h10v40H10V24h10l5-8Z"/><circle cx="40" cy="44" r="13"/><path d="M59 32h3M35 44l4 4 7-9"/>'
  };
  const icon = key => `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key] || icons.science}</svg>`;
  const card = tool => `<a class="creative-card tone-${tool.color}" href="tools.html?tool=${tool.id}" data-tool="${tool.id}"><div class="creative-card-top"><span>${tool.category}</span><span class="creative-badge">${tool.badge}</span></div><div class="creative-art">${icon(tool.icon)}<span class="creative-arrow" aria-hidden="true">↗</span></div><div class="creative-card-copy"><h3>${tool.name}</h3><p>${tool.summary}</p></div></a>`;
  document.querySelectorAll('[data-tools-grid]').forEach(grid => { grid.innerHTML = tools.map(card).join(''); });
  const shell = document.querySelector('.toolbox-shell');
  if (!shell) return;

  const nav = document.querySelector('#toolbox-nav');
  nav.innerHTML = `<a href="tools.html" data-tool="overview" class="toolbox-nav-link"><span class="nav-mini">✳</span><span>全部工具</span></a>` + tools.map(tool => `<a href="tools.html?tool=${tool.id}" data-tool="${tool.id}" class="toolbox-nav-link"><span class="nav-mini">${icon(tool.icon)}</span><span>${tool.name}</span><span class="nav-local">${tool.local ? 'Mac' : '↗'}</span></a>`).join('');
  const overview = document.querySelector('#tools-overview');
  const workspace = document.querySelector('#tool-workspace');
  const panels = new Map();
  const toolbar = document.querySelector('#workspace-toolbar');
  const panelHost = document.querySelector('#workspace-panels');
  let current = '';

  function makePanel(tool) {
    const panel = document.createElement('section');
    panel.className = 'workspace-panel';
    panel.setAttribute('aria-label', tool.name);
    if (tool.url) {
      panel.innerHTML = `<div class="frame-notice"><p>${tool.note}</p><a href="${tool.url}" target="_blank" rel="noopener noreferrer">独立打开 ↗</a></div><div class="frame-container"><iframe title="${tool.name}实际界面" src="${tool.url}" allow="fullscreen; clipboard-write" allowfullscreen></iframe></div>`;
    } else {
      panel.innerHTML = `<div class="local-workspace tone-${tool.color}"><div class="local-hero"><div class="local-art">${icon(tool.icon)}</div><div><span class="local-kicker">${tool.category} · 本机工具</span><h2>${tool.summary}</h2><p>${tool.detail}</p><a class="toolbox-button primary" href="${tool.local}" target="_blank" rel="noopener noreferrer">打开本机${tool.name} <span aria-hidden="true">↗</span></a></div></div><ol class="local-steps">${tool.steps.map((step, index) => `<li><span>0${index+1}</span><p>${step}</p></li>`).join('')}</ol><div class="local-launch"><h3>第一次打开？</h3><p>在装有工具的 Mac 上，先双击「${tool.launcher}」，再点击上方按钮。</p><p>${tool.note}</p></div></div>`;
    }
    panelHost.appendChild(panel);
    panels.set(tool.id, panel);
    return panel;
  }

  function renderSelection(id, focusHeading = false) {
    const tool = tools.find(item => item.id === id);
    current = tool?.id || 'overview';
    nav.querySelectorAll('[data-tool]').forEach(link => {
      const active = link.dataset.tool === current;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    overview.hidden = !!tool;
    workspace.hidden = !tool;
    panels.forEach(panel => { panel.hidden = true; });
    document.title = tool ? `${tool.name}｜刘俊威的创作工具箱` : '创作工具箱｜刘俊威的个人网站';
    if (!tool) { if (focusHeading) overview.querySelector('h1').focus({preventScroll:true}); return; }
    toolbar.innerHTML = `<div><h1 tabindex="-1">${tool.name}</h1><span class="workspace-badge">${tool.badge}</span></div><div class="workspace-actions">${tool.local ? `<a class="toolbox-button primary" href="${tool.local}" target="_blank" rel="noopener noreferrer">打开本机版 ↗</a>` : ''}${tool.download ? `<a class="toolbox-button" href="${tool.download}">下载 Mac 版 ↓</a>` : ''}${tool.url ? `<a class="toolbox-button" href="${tool.url}" target="_blank" rel="noopener noreferrer">独立打开 ↗</a>` : ''}</div>`;
    const panel = panels.get(tool.id) || makePanel(tool);
    panel.hidden = false;
    if (focusHeading) toolbar.querySelector('h1').focus({preventScroll:true});
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-tool]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const id = link.dataset.tool;
    if (id === current) return;
    history.pushState({}, '', id === 'overview' ? 'tools.html' : `tools.html?tool=${id}`);
    renderSelection(id, true);
    window.scrollTo({top:0, behavior:'instant'});
  });
  window.addEventListener('popstate', () => renderSelection(new URLSearchParams(location.search).get('tool')));
  renderSelection(new URLSearchParams(location.search).get('tool'));
})();
