(() => {
  const host = document.getElementById('portfolio-research');
  const data = window.PORTFOLIO_RESEARCH;
  if (!host || !data) return;
  const safe = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  host.innerHTML = data.accounts.map(account => `
    <article class="folio-research-card" id="research-${account.id}">
      <figure><img src="${account.cover}" alt="${account.name}公开原片的研究画面" width="1280" height="720" loading="lazy" decoding="async" style="object-position:50% ${(account.focalY ?? .5)*100}%"><figcaption>${account.label}</figcaption></figure>
      <div class="folio-research-copy"><div class="folio-research-top"><h3>${account.name}</h3><span><strong>${account.count}</strong>${account.unit}</span></div>
      <h4>${account.question}</h4><p class="folio-research-summary">${account.summary}</p>
      <ul>${account.observations.map(item => `<li><h5>${item.title}</h5><p>${item.text}</p></li>`).join('')}</ul>
      <nav aria-label="${account.name}研究资料">${account.links.map(link => `<a href="${link.url}">${link.label} ↗</a>`).join('')}</nav>
      <details class="folio-research-sources"><summary>资料范围与研究状态</summary><p>${account.scope}。${account.boundary}</p></details></div>
    </article>`).join('');

  const plans = document.getElementById('research-practice');
  const list = document.getElementById('research-practice-list');
  let loaded = false, loading = false;
  async function loadPicks() {
    if (!plans.open || loaded || loading) return;
    loading = true; list.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('research/picks.json');
      if (!response.ok) throw new Error('Selection unavailable');
      const picks = await response.json();
      list.innerHTML = picks.map(pick => `<details class="folio-pick"><summary><span>${safe(pick.account)}</span><h4>${safe(pick.short)}</h4><b aria-hidden="true">＋</b></summary>
        <div class="folio-pick-body"><div class="folio-pick-frames">${pick.screens.map(frame => `<figure><a href="research/${frame.url}" target="_blank" rel="noopener"><img src="research/${frame.url}" alt="${safe(pick.short)}原片抽样画面" loading="lazy" decoding="async"></a><figcaption>${frame.approximate ? '约 ' : ''}${Math.floor(frame.time_before / 60)}:${String(Math.floor(frame.time_before % 60)).padStart(2,'0')} · 原片截图</figcaption></figure>`).join('')}</div>
        <dl>${[['为什么选','why'],['准备怎样剪','recut'],['必须保留','preserve']].map(([title,key]) => `<div><dt>${title}</dt><dd>${safe(pick[key])}</dd></div>`).join('')}</dl>
        <a href="${safe(pick.url)}" target="_blank" rel="noopener">查看原片 ↗</a></div></details>`).join('');
      loaded = true;
    } catch {
      list.innerHTML = '<p>选片暂时未能载入。<button type="button" class="research-retry">重新载入 ↻</button>，也可<a href="research/#picks">打开完整选片页 ↗</a>。</p>';
      list.querySelector('button').addEventListener('click', loadPicks);
    } finally { loading = false; list.removeAttribute('aria-busy'); }
  }
  plans.addEventListener('toggle', loadPicks);
})();
