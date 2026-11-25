(() => {
  'use strict';
  const grid = document.querySelector('.account-tiles');
  if (!grid) return;
  const make = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const button = (cls, label) => {
    const b = make('button', cls, label);
    b.type = 'button';
    return b;
  };
  const signal = frequency => grid.dispatchEvent(new CustomEvent('folio-fact-sound', {bubbles:true, detail:frequency}));
  const press = (b, on) => b.setAttribute('aria-pressed', String(on));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const groups = window.LJW_CASES || [];
  const films = groups.flatMap(group => group.films);
  const reno = films.find(film => film.id === 'yingjun-reno');
  const questionRows = window.LJW_PORTFOLIO?.sections.find(s => s.id === 'comment-topic-proof')?.table.rows || [];

  function mount(id, build) {
    const link = grid.querySelector('a[href="#' + id + '"]');
    const record = document.getElementById(id);
    if (!link || !record) return;
    const widget = build(record);
    if (!widget) return;
    const cell = make('article', 'fact-cell');
    if (link.classList.contains('fact-highlight')) cell.classList.add('fact-mint');
    link.before(cell);
    cell.append(link, widget);
  }

  mount('account-size-record', record => {
    const flip = button('snapshot-flip');
    const face = make('span', 'snapshot-face');
    face.append(make('small', '', '账号快照'), make('b', '', '2026.11.05'), make('small', '', '翻面看准确粉丝数 ↻'));
    const back = make('span', 'snapshot-face snapshot-back');
    back.append(make('small', '', '飞瓜 · 抖音'), make('b', '', record.querySelector('strong').textContent), make('small', '', '离职后采集 · 点按翻回 ↻'));
    const sheet = make('span', 'snapshot-paper');
    sheet.append(face, back);
    flip.append(sheet);
    const set = turned => {
      press(flip, turned);
      face.setAttribute('aria-hidden', String(turned));
      back.setAttribute('aria-hidden', String(!turned));
    };
    set(false);
    flip.onclick = () => { const on = flip.getAttribute('aria-pressed') !== 'true'; set(on); signal(on ? 620 : 410); };
    return flip;
  });

  mount('reno-record', () => {
    if (!reno?.evidence?.image) return;
    const view = make('div', 'cut-compare');
    const stage = make('div', 'cut-stage');
    stage.style.setProperty('--comparison', 'url("' + reno.evidence.image + '")');
    const prior = make('span', 'cut-frame cut-prior'), later = make('span', 'cut-frame cut-later');
    const handle = make('span', 'cut-divider');
    handle.append(make('b', '', '‹ ›'));
    for (const node of [prior, later, handle]) node.setAttribute('aria-hidden','true');
    const slider = make('input', 'cut-slider');
    slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.value = '50';
    slider.setAttribute('aria-label', '拖动分界线，对照发布版小屏操作和试剪版后摄取景');
    let band = 5;
    function align() {
      const value = Number(slider.value);
      stage.style.setProperty('--split', value + '%');
      slider.setAttribute('aria-valuetext', '发布版画面占 ' + value + '%，试剪版占 ' + (100-value) + '%');
      const next = Math.floor(value / 10);
      if (next !== band) { band = next; signal(320 + next * 26); }
    }
    slider.addEventListener('input', align);
    align(); stage.append(later, prior, handle, slider);
    const key = make('div', 'fact-key');
    key.append(make('span', '', '发布版 00:58'), make('span', '', '试剪版 00:02'));
    view.append(stage, key);
    return view;
  });

  function choices(labels, selected, onChange) {
    const bar = make('div', 'fact-choices');
    const controls = labels.map((label, index) => {
      const b = button('', label);
      press(b, index === selected);
      b.onclick = () => {
        if (b.getAttribute('aria-pressed') === 'true') return;
        controls.forEach((child, i) => press(child, i === index));
        onChange(index);
        signal(380 + 100 * index);
      };
      bar.append(b);
      return b;
    });
    return bar;
  }

  mount('archive-record', record => {
    const rows = [...record.querySelectorAll('summary strong')];
    const total = Number(record.querySelector('[data-catalog-size]')?.textContent);
    if (!total || rows.length !== 2) return;
    const counts = [total, ...rows.map(n => parseInt(n.textContent, 10))];
    const labels = ['目录', '原片', '星图'];
    const widget = make('div', 'archive-dots');
    const plot = make('div', 'dot-plot');
    plot.setAttribute('aria-hidden', 'true');
    const dots = Array.from({length: total}, (_, i) => {
      const dot = make('i');
      dot.style.setProperty('--delay', (i % 22) * 6 + 'ms');
      plot.append(dot); return dot;
    });
    const tally = make('output', 'sample-count');
    const set = index => {
      const count = counts[index];
      tally.textContent = labels[index] + ' ' + count + ' / ' + total;
      dots.forEach((dot,i) => dot.classList.toggle('lit', i < count));
    };
    const controls = choices(labels, 1, set);
    controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', '选择留档范围');
    set(1); widget.append(tally, plot, controls);
    return widget;
  });

  mount('films-record', () => {
    if (!films.length) return;
    const view = make('div', 'film-browse'), rail = make('div', 'film-rail');
    rail.setAttribute('role','region'); rail.setAttribute('aria-label','滑动查看六部代表作');
    const prev = button('film-step', '←'), next = button('film-step', '→'), count = make('output', 'film-position');
    prev.setAttribute('aria-label','上一部作品'); next.setAttribute('aria-label','下一部作品');
    const slides = films.map(film => {
      const link = make('a', 'film-slide');
      link.href = 'project.html?work=' + encodeURIComponent(film.id);
      const img = make('img'); img.src = film.poster; img.alt = ''; img.loading = 'lazy';
      const legend = make('span', 'film-caption');
      legend.append(make('b', '', film.name), make('small', '', film.platform + ' · 团队播放 ' + film.views + ' 万'));
      link.append(img, legend); rail.append(link);
      return link;
    });
    let index = 0, target = null;
    const sync = (i, audible) => {
      const changed = i !== index;
      index = i;
      count.textContent = (i+1) + ' / ' + slides.length;
      prev.disabled = i === 0; next.disabled = i === slides.length-1;
      slides.forEach((s, j) => { s.tabIndex = j === i ? 0 : -1; });
      if (audible && changed) signal(380 + i * 52);
    };
    function go(n) {
      target = Math.max(0, Math.min(slides.length-1, n));
      rail.scrollTo({left:target * rail.clientWidth, behavior:reduced.matches ? 'instant' : 'smooth'});
    }
    const current = () => Math.max(0, Math.min(slides.length-1, Math.round(rail.scrollLeft / Math.max(1, rail.clientWidth))));
    next.onclick = () => go((target ?? index) + 1);
    prev.onclick = () => go((target ?? index) - 1);
    rail.addEventListener('scroll', () => {
      const i = current(); sync(i, true);
      if (i === target) target = null;
    },{passive:true});
    rail.addEventListener('pointerdown', () => { target = null; });
    view.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault(); go((target ?? index) + (e.key === 'ArrowRight' ? 1 : -1));
      if (rail.contains(document.activeElement)) rail.focus({preventScroll:true});
    });
    rail.tabIndex = 0;
    const nav = make('div','film-controls');
    nav.append(count,prev,next); view.append(rail,nav); sync(0,false);
    return view;
  });

  mount('questions-record', record => {
    const steps = [...record.querySelectorAll('details')];
    if (steps.length !== 3) return;
    const view = make('div','question-flow'), panel = make('div','question-panel');
    panel.setAttribute('aria-live','polite');
    const set = i => {
      panel.replaceChildren(make('b','', steps[i].querySelector('strong').textContent));
      if (i === 2 && questionRows.length) {
        const list = make('ul', 'question-list');
        questionRows.forEach(([question]) => list.append(make('li','',question)));
        panel.append(list);
      } else panel.append(make('p','', steps[i].querySelector('p').textContent));
      if (!reduced.matches) panel.animate([{opacity:.2, transform:'translateY(8px)'},{opacity:1, transform:'none'}],{duration:260});
    };
    const controls = choices(['原评论','规则初筛','可拍选题'],0,set);
    controls.setAttribute('role','group'); controls.setAttribute('aria-label','查看评论筛选的各步结果');
    set(0); view.append(controls, panel);
    return view;
  });
})();
