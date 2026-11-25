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
  async function cue(frequency, end = frequency * 1.3, level = 0.42) {
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
      osc.frequency.exponentialRampToValueAtTime(end, now + 0.075);
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(level, now + 0.009);
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
      if (!control || control === sound || control.matches('.number-close')) return;
      if (control.matches('.fact-tile,.inspect-number')) cue(360,610);
      else if (control.matches('.fact-detail-row summary')) {
        if (control.parentElement.open) cue(420,320);
        else cue(460,540);
      } else cue(460);
    });
  } else if (sound) sound.hidden = true;

  // A short mask reveals the printed value without counting through fictional data.
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const metricSelector = '.fact-tile,.fact-detail-row summary,.inspect-number,.project-card,.film-tab,.proof-tabs button';
  let lastPreview = 0;
  function previewMetric(control) {
    if (!control) return;
    const value = control.querySelector('.fact-copy,strong,.project-readout,.film-tab-meta') || control;
    if (!reduce.matches && value.animate) {
      value.animate([
        {opacity:0.55,clipPath:'inset(0 0 27% 0)'},
        {opacity:1,clipPath:'inset(0 0 0 0)'}
      ],{duration:250,easing:'cubic-bezier(.22,1,.36,1)'});
    }
    const now = performance.now();
    if (enabled && context?.state === 'running' && now - lastPreview > 150) {
      cue(720,630,0.12);
      lastPreview = now;
    }
  }
  document.addEventListener('pointerover',e=>{
    if(e.pointerType !== 'mouse') return;
    const control = e.target.closest(metricSelector);
    if(control && !control.contains(e.relatedTarget)) previewMetric(control);
  });
  document.addEventListener('pointerdown',e=>{
    if(e.pointerType === 'touch' || e.pointerType === 'pen') previewMetric(e.target.closest(metricSelector));
  });
  document.addEventListener('focusin',e=>{
    if(e.target.matches(':focus-visible')) previewMetric(e.target.closest(metricSelector));
  });

  // Keep each metric next to its evidence. The dialog reads the existing row verbatim.
  const dialog=element('dialog','number-dialog');
  dialog.setAttribute('aria-labelledby','number-title');
  const close=element('button','number-close','关闭 ×'); close.type='button';
  const title=element('h2'); title.id='number-title';
  const detailList=element('dl'), annotation=element('p','number-note');
  dialog.append(close,title,detailList,annotation); document.body.append(dialog);
  let opener, sheetMotion, closing=false;
  function openSheet(trigger) {
    if(dialog.open) return;
    opener=trigger;
    dialog.showModal();
    close.focus({preventScroll:true});
    if(reduce.matches) return;
    const from=trigger.getBoundingClientRect(), to=dialog.getBoundingClientRect();
    const dx=from.left+from.width/2-to.left-to.width/2;
    const dy=from.top+from.height/2-to.top-to.height/2;
    const startScale=Math.min(.78,Math.max(.28,from.width/to.width));
    dialog.style.setProperty('--sheet-start','translate('+dx+'px,'+dy+'px) scale('+startScale+')');
    sheetMotion=dialog.animate([
      {transform:'var(--sheet-start)',opacity:.4,borderRadius:'30px'},
      {transform:'none',opacity:1,borderRadius:'18px'}
    ],{duration:400,easing:'cubic-bezier(.18,.78,.18,1)'});
  }
  function closeSheet() {
    if(!dialog.open || closing) return;
    if(reduce.matches || !opener?.isConnected){dialog.close();return;}
    closing=true;
    const current=getComputedStyle(dialog).transform;
    sheetMotion?.cancel();
    const motion=dialog.animate([
      {transform:current,opacity:1},
      {transform:'var(--sheet-start)',opacity:0}
    ],{duration:230,easing:'cubic-bezier(.5,0,.85,.45)',fill:'forwards'});
    sheetMotion=motion;
    motion.onfinish=()=>dialog.close();
  }
  close.addEventListener('click',closeSheet);
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeSheet();});
  dialog.addEventListener('close',()=>{
    sheetMotion?.cancel(); sheetMotion=null; closing=false; opener=null;
  });
  dialog.addEventListener('close',()=>cue(420,265));
  dialog.addEventListener('click',e=>{if(e.target===dialog && !e.target.closest('button')) {
    const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSheet();
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
      openSheet(b);
    });
    node.replaceChildren(b);
  }
  const filmRecords = $('[data-films-record]');
  if (filmRecords) {
    films.forEach(({group,film})=>{
      const row = element('details','fact-detail-row');
      const summary = element('summary');
      summary.append(element('span','',film.name),element('strong','',film.views+' 万播放'));
      const link = element('a','','看这部作品 ↗');
      link.href = caseUrl(film);
      row.append(summary,element('p','',film.platform+' · '+group.name+'。'+group.metricNote),link);
      filmRecords.append(row);
    });
  }

  const homeFacts = all('.account-tiles a[href^="#"]');
  if (homeFacts.length) {
    const entrance = !reduce.matches && 'IntersectionObserver' in window
      ? new IntersectionObserver(entries=>{
          const visible=entries.filter(entry=>entry.isIntersecting);
          visible.forEach(({target},i)=>{
            entrance.unobserve(target);
            if(reduce.matches) return;
            target.animate([
              {opacity:.22,transform:'translateY(34px)'},
              {opacity:1,transform:'none'}
            ],{duration:630,delay:Math.min(i,2)*70,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
          });
        },{threshold:.13})
      : null;
    for(const tile of homeFacts) {
      const hint=element('span','fact-open-cue');
      hint.setAttribute('aria-hidden','true');
      hint.append(element('span','fact-open-label','查看明细'),element('span','fact-arrow','↗'));
      tile.append(hint);
      tile.addEventListener('pointerenter',e=>{
        if(e.pointerType !== 'mouse') return;
        const rect=tile.getBoundingClientRect();
        tile.style.setProperty('--entry-x', 100*(e.clientX-rect.left)/rect.width+'%');
        tile.style.setProperty('--entry-y', 100*(e.clientY-rect.top)/rect.height+'%');
        tile.classList.add('is-pointed');
      });
      tile.addEventListener('pointerleave',()=>tile.classList.remove('is-pointed'));
      entrance?.observe(tile);
    }
  }
  if (homeFacts.length && typeof dialog.showModal === 'function') {
    const recordBody = element('div','number-record');
    dialog.append(recordBody);
    function showRecord(record,trigger) {
      recordBody.replaceChildren(...[...record.children].slice(1).map(n=>n.cloneNode(true)));
      title.textContent = $('h3',record).textContent;
      detailList.hidden = true;
      annotation.hidden = true;
      openSheet(trigger);
    }
    dialog.addEventListener('close',()=>{
      recordBody.replaceChildren();
      detailList.hidden = false;
    });
    homeFacts.forEach(link=>{
      const record = document.getElementById(link.hash.slice(1));
      record.hidden = true;
      link.setAttribute('aria-haspopup','dialog');
      link.addEventListener('click',e=>{
        if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)return;
        e.preventDefault();
        showRecord(record,link);
      });
      if(location.hash===link.hash) {
        link.focus();
        showRecord(record,link);
      }
    });
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
      const link=element('a','ledger-return','看英俊账号规模与样本 ↗'); link.href='./#account-data';
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
