'use strict';
(() => {
  const data = JSON.parse(document.getElementById('reportData').textContent);
  const chart = document.getElementById('chart');
  const summary = document.getElementById('metricline');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const labels = {likes:'点赞', comments:'评论', saves:'收藏', shares:'分享'};
  const keys = Object.keys(labels);
  const format = n => n >= 10000 ? `${+(n / 10000).toFixed(2)}万` : Math.round(n).toLocaleString('zh-CN');
  const median = a => { const s = [...a].sort((x,y) => x-y), m = Math.floor(s.length/2); return s.length%2 ? s[m] : (s[m-1]+s[m])/2; };
  const tweens = new Map();
  const counts = new Map();
  const rowsByUrl = new Map();
  let scope = '30', metric = 'likes', summarySeen = false;
  const canAnimate = () => !motion.matches && !document.hidden;

  // Retarget from the displayed value, including during rapid metric changes.
  function countTo(el, target, formatter = format, animate = true, delay = 0) {
    const previous = tweens.get(el);
    if (previous) cancelAnimationFrame(previous.frame);
    const from = counts.get(el) || 0;
    const finish = () => { el.textContent = formatter(target); counts.set(el,target); tweens.delete(el); };
    if (!animate || !canAnimate() || from === target) { finish(); return; }
    const start = performance.now() + delay;
    const tween = {frame:0, finish};
    tweens.set(el,tween);
    function step(now) {
      if (!canAnimate()) { finish(); return; }
      const p = Math.min(1,Math.max(0,(now-start)/850));
      const value = from + (target-from)*(1-Math.pow(1-p,3));
      counts.set(el,value); el.textContent = formatter(value);
      if (p === 1) finish(); else tween.frame = requestAnimationFrame(step);
    }
    tween.frame = requestAnimationFrame(step);
  }
  function observeOnce(el, callback) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if(entry.isIntersecting && !document.body.classList.contains('entry-pending')) {
        observer.unobserve(el); callback();
      }
    }, {threshold:.25});
    observer.observe(el);
    window.addEventListener('lab:entered', () => { observer.unobserve(el); observer.observe(el); }, {once:true});
  }
  function resetCount(el) {
    const running = tweens.get(el);
    if(running) cancelAnimationFrame(running.frame);
    tweens.delete(el); counts.delete(el);
  }
  // Re-arm only after the whole block leaves view, avoiding edge jitter.
  function observeReentry(el, callback) {
    let active = false;
    const observer = new IntersectionObserver(entries => {
      for(const entry of entries) {
        if(!entry.isIntersecting) {active=false;continue;}
        if(!active && entry.intersectionRatio >= .25 && !document.body.classList.contains('entry-pending')) {
          active=true; callback();
        }
      }
    },{threshold:[0,.25]});
    observer.observe(el);
    window.addEventListener('lab:entered',() => {active=false;observer.unobserve(el);observer.observe(el);},{once:true});
  }

  document.querySelectorAll('.stat strong').forEach((strong,i) => {
    const text = strong.firstChild;
    if (!text || text.nodeType !== Node.TEXT_NODE) return;
    const original = text.textContent, target = Number(original.trim());
    if (!Number.isFinite(target)) return;
    const decimals = (original.split('.')[1] || '').length;
    const value = document.createElement('span');
    value.className = 'count-value'; value.setAttribute('aria-hidden','true');
    value.textContent = original; text.replaceWith(value);
    strong.setAttribute('aria-label',original + (strong.querySelector('.unit')?.textContent || ''));
    observeReentry(strong,() => {resetCount(value);countTo(value,target,n => n.toFixed(decimals),true,i*65);});
  });

  keys.forEach(k => {
    const card = document.createElement('button'); card.type='button'; card.className = 'metric-card';
    card.dataset.key = k;
    const strong = document.createElement('strong');
    const value = document.createElement('span'); value.className = 'count-value'; value.setAttribute('aria-hidden','true');
    strong.append(value); card.append(strong,document.createElement('span')); summary.append(card);
    card.addEventListener('click',() => replayMetric(k));
  });
  observeReentry(summary,() => { summarySeen = true; summary.querySelectorAll('.count-value').forEach(resetCount); updateSummary(true); });

  function selectedRows() {
    return scope === '30' ? data.rows.filter(r => r.date.slice(0,10)>='2026-09-11' && r.date.slice(0,10)<='2026-10-10') : data.rows;
  }
  function updateSummary(animate) {
    const rows = selectedRows();
    [...summary.children].forEach((card,i) => {
      const k = card.dataset.key, target = median(rows.map(r => r[k]));
      card.classList.toggle('is-active',k === metric);
      card.setAttribute('aria-label',`重播${labels[k]}中位数 ${format(target)}，${rows.length}条样本`);
      card.title=`点击重播${labels[k]}数字`;
      card.querySelector('strong').setAttribute('aria-label',format(target));
      card.lastElementChild.textContent = `${labels[k]}中位数 · n=${rows.length}`;
      countTo(card.querySelector('.count-value'),target,format,animate && summarySeen,i*55);
    });
  }
  function replayMetric(k) {
    const card=summary.querySelector(`[data-key="${k}"]`),target=median(selectedRows().map(r=>r[k]));
    const value=card.querySelector('.count-value');resetCount(value);countTo(value,target);
  }
  data.rows.forEach((r,i) => {
    const row = document.createElement('div'); row.className = 'barrow'; row.dataset.url = r.url;
    const link = document.createElement('a'); link.className = 'barname'; link.href = r.url;
    link.target = '_blank'; link.rel = 'noopener'; link.textContent = r.title; link.title = r.title;
    const track = document.createElement('button'); track.type = 'button'; track.className = 'bartrack';
    track.setAttribute('aria-expanded','false'); track.setAttribute('aria-describedby',`data-detail-${i}`);
    const bar = document.createElement('span'); bar.className = 'bar' + (r.brandTagged ? ' brand' : '');
    track.append(bar);
    const value = document.createElement('span'); value.className = 'barvalue'; value.setAttribute('aria-hidden','true');
    const detail = document.createElement('div'); detail.className = 'data-tooltip'; detail.id = `data-detail-${i}`;
    const title = document.createElement('strong'); title.textContent = r.title;
    const date = document.createElement('small'); date.textContent = `${r.date} · ${r.brandTagged?'含品牌标签':'未见品牌标签'}`;
    const facts = document.createElement('dl');
    keys.forEach(k => { const fact = document.createElement('div'); const dt = document.createElement('dt'); dt.textContent = labels[k]; const dd = document.createElement('dd'); dd.textContent = format(r[k]); fact.append(dt,dd); facts.append(fact); });
    detail.append(title,date,facts); row.append(link,track,value,detail); chart.append(row);
    const state = {row,track,bar,value,r,seen:false,width:0}; rowsByUrl.set(r.url,state);
    track.addEventListener('click',() => {
      const open = !row.classList.contains('is-selected');
      rowsByUrl.forEach(s => { s.row.classList.remove('is-selected'); s.track.setAttribute('aria-expanded','false'); });
      row.classList.toggle('is-selected',open); track.setAttribute('aria-expanded',String(open));
    });
    track.addEventListener('keydown',e => { if(e.key === 'Escape') { row.classList.remove('is-selected'); track.setAttribute('aria-expanded','false'); track.blur(); } });
    observeOnce(row,() => {
      state.seen = true;
      row.classList.add('data-revealed');
      bar.style.transitionDelay = `${Math.min(i*40,240)}ms,0ms`;
      bar.style.width = `${state.width}%`;
      countTo(value,r[metric]);
    });
  });
  function updateChart() {
    const rows = selectedRows(), visible = new Set(rows.map(r => r.url));
    const max = Math.max(...rows.map(r => r[metric]));
    rowsByUrl.forEach(s => {
      s.row.hidden = !visible.has(s.r.url);
      s.row.classList.remove('is-selected'); s.track.setAttribute('aria-expanded','false');
      s.width = s.r[metric]/max*100;
      s.bar.style.transitionDelay = '0ms';
      s.bar.style.width = `${s.seen || motion.matches ? s.width : 0}%`;
      s.track.setAttribute('aria-label',`${s.r.title}，${labels[metric]}${format(s.r[metric])}，点击查看赞评藏转`);
      if(s.seen) countTo(s.value,s.r[metric]); else s.value.textContent = format(s.r[metric]);
      s.row.querySelectorAll('dl div').forEach((el,i) => el.classList.toggle('is-active',keys[i]===metric));
    });
    chart.setAttribute('aria-label',`${rows.length}条作品${labels[metric]}柱状图`);
    document.getElementById('chartnote').textContent = scope === '30' ? '时间窗：2026.09.11—10.10；公开可见非置顶作品7条。数据截至2026.10.11；数量采用抖音手工核验。' : '样本跨度：2026.08.14—09.30；最近10条非置顶作品。含品牌标签4条，不逐条认定为已付费商单。';
    document.querySelectorAll('[data-scope]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.scope===scope)));
    document.querySelectorAll('[data-metric]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.metric===metric)));
    updateSummary(true);
  }
  document.querySelectorAll('[data-scope]').forEach(b => b.addEventListener('click',() => {if(scope!==b.dataset.scope){scope=b.dataset.scope;updateChart();}}));
  document.querySelectorAll('[data-metric]').forEach(b => b.addEventListener('click',() => {if(metric!==b.dataset.metric){metric=b.dataset.metric;updateChart();}replayMetric(metric);}));
  function finishMotion() {
    for(const t of [...tweens.values()]) {cancelAnimationFrame(t.frame);t.finish();}
    rowsByUrl.forEach(s => {if(s.seen || motion.matches) s.bar.style.width = `${s.width}%`;});
  }
  document.addEventListener('visibilitychange',() => {if(document.hidden) finishMotion();});
  motion.addEventListener('change',() => {if(motion.matches) finishMotion();});
  window.addEventListener('beforeprint',() => {finishMotion();rowsByUrl.forEach(s => s.bar.style.width = `${s.width}%`);});
  updateChart();
})();
