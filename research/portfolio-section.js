(() => {
  const host=document.getElementById('portfolio-research'),data=window.PORTFOLIO_RESEARCH;
  if(!host||!data)return;
  host.innerHTML=data.accounts.map(item=>`<article class="folio-research-card"><img src="${item.cover}" alt="${item.name}公开原片研究画面" width="100" height="100" loading="lazy" style="object-position:50% ${(item.focalY??.5)*100}%"><div><h3>${item.name}</h3><p>${item.question}</p><a href="${item.links[0].url}">查看${item.id==='bidao'?'IP 报告':'账号研究'} ↗</a></div></article>`).join('');
})();
