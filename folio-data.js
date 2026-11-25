(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const element = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  const groups = window.LJW_CASES || [];
  const films = groups.flatMap(group => group.films.map(film => ({group, film})));
  const caseUrl = film => 'project.html?work=' + encodeURIComponent(film.id);

  // Audio is synthesized on demand and unlocked only by a gesture.
  const sound = $('.sound-control');
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  let enabled = false, context, volume;
  try { enabled = localStorage.getItem('folio:interaction-audio') === 'on'; } catch {}
  function showSound() {
    sound.setAttribute('aria-pressed', String(enabled));
    $('.sound-label', sound).textContent = enabled ? '音效开' : '音效关';
  }
  async function cue(frequency) {
    if (!enabled || !AudioEngine) return;
    try {
      if (!context) {
        context = new AudioEngine();
        volume = context.createGain();
        volume.connect(context.destination);
      }
      if (context.state !== 'running') await context.resume();
      if (!enabled || context.state !== 'running') return;
      const now = context.currentTime;
      volume.gain.value = 0.13;
      const osc = context.createOscillator(), envelope = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.3, now + 0.075);
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(0.42, now + 0.009);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(envelope); envelope.connect(volume);
      osc.onended = () => { osc.disconnect(); envelope.disconnect(); };
      osc.start(now); osc.stop(now + 0.125);
    } catch { /* Audio may be unavailable while the page is in the background. */ }
  }
  if (sound && AudioEngine) {
    showSound();
    sound.addEventListener('click', () => {
      enabled = !enabled;
      showSound();
      try { localStorage.setItem('folio:interaction-audio', enabled ? 'on' : 'off'); } catch {}
      if (enabled) cue(550);
      else if (volume) volume.gain.value = 0;
    });
    document.addEventListener('click', e => {
      const control = e.target.closest('a, button, summary');
      if (control && control !== sound) cue(control.matches('.ledger-row,.inspect-number') ? 330 : 460);
    });
  } else if (sound) sound.hidden = true;

  const fanRows = [
    {label:'2025.08—11',display:'缺记录',value:null,detail:'入职月份为 2025 年 8 月。该月到 11 月没有可核对的区间净增记录，整段任期的变化仍待核。'},
    {label:'2025.12—2026.03',display:'约 +2.7 万',value:27000,detail:'2025.12.01—2026.03.31。飞瓜显示「2.7w」，这是简写值，所以三段合计也保留约数。'},
    {label:'2026.04—07',display:'−1,683',value:-1683,detail:'2026.04.01—07.31。飞瓜记录这四个月账号粉丝净减少 1,683 人。'},
    {label:'2026.08—10',display:'−5,582',value:-5582,detail:'2026.08.01—10.31。飞瓜记录这三个月账号粉丝净减少 5,582 人，区间截止日为 10 月 31 日。'}
  ];
  const board = $('#account-data');
  if (board) {
    const chart = $('#ledger-chart'), detail = $('#ledger-detail'), source = $('#ledger-source');
    const modes = {
      fans: {kind:'英俊姐妹日记 · 抖音账号',total:'约 +1.97 万',caption:'团队账号净增粉丝，覆盖 2025.12.01—2026.10.31。入职后的 8—11 月缺记录。',rows:fanRows,source:'assets/portfolio/yingjun-followers.csv',action:'下载飞瓜区间明细 ↓'},
      plays: {kind:'英俊姐妹日记 / 毕导 · 团队成片',total:'6 部作品',caption:'选择作品查看平台播放留档及个人分工。抖音与 B 站各按本平台记录。',rows:films.map(({group,film}) => ({label:film.name,display:film.views+' 万',value:Number(film.views),detail:film.platform+' · '+group.name+'。'+group.metricNote,link:caseUrl(film),action:'看这部作品 ↗'})),source:'projects.html',action:'打开作品目录 ↗'},
      comments: {kind:'英俊姐妹日记 · 个人选题实测',total:'4 个可拍问题',caption:'取三条作品的顶层评论，先做规则筛选，再回到原话判断哪些问题值得拍。',rows:[
        {label:'原始评论',display:'214 条',value:214,detail:'来自 A7 Pro Max、Reno16 和 Find X9 的顶层评论。这是本次取样范围。'},
        {label:'规则初筛',display:'31 条',value:31,detail:'按提问特征提取候选。玩笑和反问也可能命中，需要逐条回看语境。'},
        {label:'人工选题',display:'4 个',value:4,detail:'结合账号方向和拍摄条件，排除玩笑并补回规则漏掉的需求。点开选题卡可回看原评论编号。'}
      ],source:'about.html#comment-topic-proof',action:'查看四张选题卡 ↗'}
    };
    const last = {fans:1, plays:0, comments:2};
    function draw(key) {
      const data = modes[key];
      all('[data-mode]',board).forEach(button => button.setAttribute('aria-pressed',String(button.dataset.mode === key)));
      $('#ledger-kind').textContent = data.kind;
      $('#ledger-total').textContent = data.total;
      $('#ledger-caption').textContent = data.caption;
      source.href = data.source; source.textContent = data.action;
      source.toggleAttribute('download',key === 'fans');
      chart.replaceChildren(); chart.dataset.mode = key;
      const max = Math.max(...data.rows.map(row => Math.abs(row.value || 0)));
      const buttons = data.rows.map((row,i) => {
        const button = element('button','ledger-row');
        button.type='button'; button.setAttribute('aria-controls','ledger-detail');
        const track = element('span','ledger-track'), bar = element('i');
        track.setAttribute('aria-hidden','true'); track.append(bar);
        button.classList.toggle('has-gap',row.value === null);
        button.classList.toggle('is-loss',row.value < 0);
        if (row.value !== null) bar.style.setProperty('--fill',Math.abs(row.value)/max);
        button.append(element('span','ledger-label',row.label),track,element('strong','',row.display));
        button.addEventListener('click',() => select(i));
        chart.append(button); return button;
      });
      function select(index) {
        last[key]=index;
        buttons.forEach((b,i) => b.setAttribute('aria-pressed',String(i===index)));
        const row=data.rows[index];
        detail.replaceChildren(document.createTextNode(row.detail));
        if (row.link) {const a=element('a','',row.action); a.href=row.link; detail.append(' ',a);}
      }
      select(last[key]);
    }
    all('[data-mode]',board).forEach(b=>b.addEventListener('click',()=>draw(b.dataset.mode)));
    draw('fans');
  }

  // Keep each metric next to its evidence. The dialog reads the existing row verbatim.
  const dialog=element('dialog','number-dialog');
  dialog.setAttribute('aria-labelledby','number-title');
  const close=element('button','number-close','关闭 ×'); close.type='button';
  const title=element('h2'); title.id='number-title';
  const detailList=element('dl'), annotation=element('p','number-note');
  dialog.append(close,title,detailList,annotation); document.body.append(dialog);
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog && !e.target.closest('button')) {
    const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
  }});
  function inspect(node, heading, fields, note) {
    if(!node || node.querySelector('a,button,video')) return;
    const b=element('button','inspect-number',node.textContent.trim());
    b.type='button'; b.setAttribute('aria-haspopup','dialog');
    b.setAttribute('aria-label',b.textContent+'，查看'+heading);
    b.addEventListener('click',()=>{
      title.textContent=heading; detailList.replaceChildren();
      fields.forEach(([k,v])=>detailList.append(element('dt','',k),element('dd','',v)));
      annotation.textContent=note || ''; annotation.hidden=!note;
      dialog.showModal(); close.focus();
    });
    node.replaceChildren(b);
  }
  all('table').forEach(table=>{
    const headers=all('thead th',table).map(c=>c.textContent.trim());
    const section=table.closest('section,article');
    const heading=section?.querySelector('h2,h3,h4')?.textContent.trim() || '记录明细';
    const note=section?.querySelector('.proof-note')?.textContent.trim();
    all('tbody tr',table).forEach(row=>{
      const cells=[...row.cells], fields=cells.map((c,i)=>[headers[i] || '记录',c.textContent.trim()]);
      cells.forEach((c,i)=>{if(/\d/.test(fields[i][1]) && fields[i][1].length<=60)inspect(c,heading,fields,note);});
    });
  });
  groups.forEach(group=>{
    const section=document.getElementById(group.id);
    if(!section) return;
    all('.case-output strong',section).forEach((n,i)=>inspect(n,group.name+' · 工作记录',[[group.output[i][1],group.output[i][0]],['统计背景',group.context]],null));
    group.films.forEach(film=>inspect($('#work-'+film.id+' .film-number strong',section),film.name,[['平台',film.platform],['团队作品播放量',film.views+' 万'],['个人分工',group.filmRole]],group.metricNote));
    if(group.id==='yingjun'){
      const link=element('a','ledger-return','看英俊账号粉丝变化 ↗'); link.href='./#account-data';
      $('.case-output',section)?.after(link);
    }
  });
  all('.project-card[data-work]').forEach(card=>{
    const entry=films.find(({film})=>film.id===card.dataset.work);
    if(!entry)return;
    const stamp=element('span','project-readout',entry.film.platform+' · '+entry.film.views+' 万播放');
    const next=element('span','','看分工 ↗');
    stamp.append(next); card.append(stamp);
  });

  // Inline quantities share the original paragraph and the evidence image, when supplied.
  const magnitudes=/[+−-]?\d+(?:[,.]\d+)*(?:\s*(?:个|份|条|套|万次|万播放|秒|%|％|轮|版|组|张|次播放|小时))|\d{1,2}:\d{2}/g;
  all('.proof-copy,.proof-note,.case-intro p,.case-shot-time,.case-cut-time,.flow-copy > p,.film-meta,.case-employment').forEach(paragraph=>{
    if(paragraph.closest('a,button') || paragraph.children.length) return;
    const original=paragraph.textContent, matches=[...original.matchAll(magnitudes)];
    if(!matches.length)return;
    const section=paragraph.closest('.portfolio-proof,.case-study,.workflow-panel,section');
    const heading=section?.querySelector('h2,h3,h4')?.textContent.trim() || '制作记录';
    const note=section?.querySelector('.proof-note')?.textContent.trim() || '';
    const fragment=document.createDocumentFragment();let position=0;
    matches.forEach(match=>{
      fragment.append(original.slice(position,match.index));
      const span=element('span','',match[0]);
      inspect(span,heading,[['选中的数值',match[0]],['原文',original]],note===original?'':note);
      fragment.append(span);position=match.index+match[0].length;
    });
    fragment.append(original.slice(position));paragraph.replaceChildren(fragment);
  });
  const work=films.find(({film})=>film.id===new URLSearchParams(location.search).get('work'));
  if(work && $('#project-content')){
    const {group,film}=work;
    const block=all('.project-notes > section.folio-split').find(s=>$('h2',s)?.textContent==='团队作品表现');
    if(block) inspect($('p',block),film.name,[['团队作品播放量',film.views+' 万'],['平台',film.platform],['个人分工',group.filmRole]],group.metricNote);
  }
})();
