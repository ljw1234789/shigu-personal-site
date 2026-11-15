(()=>{
'use strict';
const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];
const groups=window.LJW_CASES||[];

function renderCaseEvidence(evidence, source){
  if(!evidence) return '';
  const {shotPlan,image,width,height,alt,caption,recut}=evidence;
  return `${renderCaseWorkflow(evidence.workflow)}
  <section class="case-proof" id="reno16-shots" aria-labelledby="reno16-shots-title">
    <header class="case-shot-header">
      <div>
        <h5 id="reno16-shots-title">Reno16 后摄自拍分镜表</h5>
        <p id="reno16-shots-source"><strong>按发布成片倒推。</strong>口播按原片字幕摘录，机位和验收标准供复拍参考。</p>
      </div>
      <a class="case-evidence-link" href="${source}" target="_blank" rel="noopener">查看原片 <span aria-hidden="true">↗</span></a>
    </header>
    ${renderCaseShotPlan(shotPlan)}
    <div class="case-recut">
      <div><h6>试剪对照</h6><p>${recut}</p></div>
      <figure>
        <a href="${image}" target="_blank" rel="noopener" aria-label="放大查看发布版与试剪对照"><img src="${image}" width="${width}" height="${height}" alt="${alt}" loading="lazy"></a>
        <figcaption>${caption}</figcaption>
      </figure>
    </div>
  </section>
  ${renderCaseTimeline(evidence.timeline)}
  ${renderWorkflowComparison(evidence.workflow)}`;
}

function renderCaseShotPlan(shotPlan){
  const columns = ['成片时码', '原片口播', '画面内容', '景别', '机位', '验收标准'];
  const cell = (label, content) => `<td role="cell"><span class="case-shot-label" aria-hidden="true">${label}</span><div>${content}</div></td>`;
  return `<table class="case-shot-plan" role="table" aria-labelledby="reno16-shots-title" aria-describedby="reno16-shots-source">
    <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">镜号</th>
      ${columns.map(label => `<th role="columnheader" scope="col">${label}</th>`).join('')}
    </tr></thead>
    <tbody role="rowgroup">${shotPlan.shots.map(shot => {
      const values = [
        `<span class="case-shot-time">${shot.time}</span>`,
        `“${shot.dialogue}”`,
        shot.action,
        shot.size,
        shot.camera,
        `<ul>${shot.checks.map(check => `<li>${check}</li>`).join('')}</ul>`
      ];
      return `<tr role="row">
        <th role="rowheader" scope="row"><span class="case-shot-number">镜 ${shot.number}</span> <strong>${shot.name}</strong></th>
        ${columns.map((label,i) => cell(label, values[i])).join('')}
      </tr>`;
    }).join('')}</tbody>
  </table>
  <p class="case-shooting-note"><strong>拍摄提醒</strong> ${shotPlan.shootingNote}</p>`;
}

function renderCaseWorkflow(workflow){
  if(!workflow) return '';
  return `<section class="case-flow" id="reno16-workflow" aria-labelledby="reno16-workflow-title">
    <header><h5 id="reno16-workflow-title">从选题到发布复盘</h5><p>我负责选题和脚本，参与剪辑。分镜要求和剪映时间轴按发布成片整理。</p></header>
    <ol class="case-flow-steps">${workflow.steps.map(([title,description,anchor,link],i)=>`<li>
      <span class="case-flow-index" aria-hidden="true">0${i+1}</span>
      <strong>${title}</strong>
      <div><p>${description}</p>${anchor?`<a class="case-evidence-link" href="#${anchor}">${link} <span aria-hidden="true">↓</span></a>`:''}</div>
    </li>`).join('')}</ol>
  </section>`;
}

function renderCaseTimeline(timeline){
  if(!timeline) return '';
  const shot=(src,alt,label)=>`<a class="case-shot" href="${src}" target="_blank" rel="noopener" aria-label="${label}（新窗口）">
    <img src="${src}" alt="${alt}" width="2940" height="1676" loading="lazy" decoding="async">
  </a>`;
  return `<section class="case-timeline" id="reno16-timeline" aria-labelledby="reno16-timeline-title">
    <header>
      <h5 id="reno16-timeline-title">剪映全片拆解</h5>
      <p>基于已发布成片重建。上层是花字和逐段字幕，中间是主画面和产品补画，下层是人声（分离）与配乐、环境声（分离）。</p>
    </header>
    <figure class="case-timeline-overview">
      ${shot(timeline.overview,'剪映实机截图：全片分轨、时间线标记与字幕编辑面板','放大全片时间轴')}
      <figcaption><span>全片时间轴 · 约 1 分 50 秒</span><a class="case-evidence-link" href="${timeline.overview}" target="_blank" rel="noopener">放大全片图 <span aria-hidden="true">↗</span></a></figcaption>
    </figure>
    <ol class="case-timeline-chapters" aria-label="全片五段结构">${timeline.chapters.map(([time,title])=>`<li><span>${time}</span><strong>${title}</strong></li>`).join('')}</ol>
    <div class="case-timeline-cuts">${timeline.cuts.map(([time,title,description,src])=>`<figure>
      ${shot(src,`剪映时间轴特写：${time} ${title}`,`放大 ${time} 切点图`)}
      <figcaption><span class="case-cut-time">${time}</span><strong>${title}</strong><p>${description}</p></figcaption>
    </figure>`).join('')}</div>
  </section>`;
}

function renderWorkflowComparison(workflow){
  if(!workflow) return '';
  return `<details class="case-workflow-compare">
    <summary>商单和自然内容，七步怎么做 <span aria-hidden="true">＋</span></summary>
    <p>商单把一条片做精，自然内容把一个栏目做稳。</p>
    <table><thead><tr><th scope="col">环节</th><th scope="col">商单</th><th scope="col">自然内容</th></tr></thead>
      <tbody>${workflow.comparison.map(([step,commercial,organic])=>`<tr><th scope="row">${step}</th><td>${commercial}</td><td>${organic}</td></tr>`).join('')}</tbody>
    </table>
  </details>`;
}
$('#case-studies').innerHTML=groups.map(g=>`<article class="case-study" id="${g.id}" aria-labelledby="case-${g.id}"><header class="case-header"><div><h3 id="case-${g.id}">${g.name}</h3><span class="case-field">${g.field}</span><p class="case-company">${g.company}</p></div><div class="case-employment"><b>${g.role}</b><br>${g.dates}</div></header><div class="case-intro"><div><h4>${g.headline}</h4><p>${g.context}</p></div><div class="case-role"><span>我的分工</span><p>${g.responsibility}</p></div></div><div class="case-output">${g.output.map(x=>`<div><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join('')}</div><div class="film-tabs" role="tablist" aria-label="${g.name}代表作">${g.films.map((f,i)=>`<button class="film-tab" role="tab" id="select-${f.id}" aria-controls="work-${f.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-film="${f.id}"><img src="${f.poster}" alt="" loading="lazy" width="64" height="58"><span><span class="film-tab-name">${f.name}</span><span class="film-tab-meta">${f.platform} ${f.views} 万播放</span></span></button>`).join('')}</div>${g.films.map((f,i)=>`<div class="film-panel" id="work-${f.id}" role="tabpanel" aria-labelledby="select-${f.id}" ${i?'hidden':''}><div class="film-layout ${f.portrait?'portrait-layout':''}"><div class="film-media"><img src="${f.poster}" alt="${f.name}视频封面" loading="lazy"><video controls playsinline preload="none" poster="${f.poster}" data-src="${f.media}" aria-label="${f.name}完整视频" hidden></video><button class="film-play" data-play="${f.id}" aria-label="播放${f.name}"><span>播放成片 · ${f.duration}</span></button></div><div class="film-copy"><p class="film-meta">${f.date} / ${g.field}${f.releaseNote?` · ${f.releaseNote}`:''}</p><h4>${f.name}</h4><p class="film-angle">${f.angle}</p><div class="film-number"><strong>${f.views}</strong><span>万次播放</span><small>${f.platform} · 团队作品表现</small></div><p class="film-my-role"><b>我的参与：</b>${g.filmRole}</p><a class="film-source" href="${f.source}" target="_blank" rel="noopener">${f.platform}原片 <span>↗</span></a><p class="film-status" aria-live="polite" role="status"></p></div></div><details class="film-details"><summary><span>${f.evidence?'看商单流程与剪辑拆解':'展开案例：从问题到成片'}</span><b aria-hidden="true">＋</b></summary><div class="case-breakdown"><div><h5>要解决的问题</h5><p>${f.problem}</p></div><div><h5>${f.judgmentLabel||'我的判断'}</h5><p>${f.judgment}</p></div><div><h5>具体参与的工作</h5><ol>${f.actions.map(a=>`<li><b>${a[0]}：</b>${a[1]}</li>`).join('')}</ol></div>${renderCaseEvidence(f.evidence,f.source)}<div class="metric-source">${g.metricNote}<a href="${f.source}" target="_blank" rel="noopener">查看原片 ↗</a></div></div></details></div>`).join('')}</article>`).join('');
const pauseOthers=except=>$$('.film-panel video').forEach(v=>{if(v!==except)v.pause()});
function selectFilm(id,changeHash=false){const tab=$(`[data-film="${id}"]`);if(!tab)return;const group=tab.closest('.case-study');$$('video',group).forEach(v=>v.pause());$$('.film-tab',group).forEach(b=>{const active=b===tab;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;});$$('.film-panel',group).forEach(p=>{const hidden=p.id!=='work-'+id;p.hidden=hidden;p.setAttribute('aria-hidden',String(hidden));if(hidden)$$('details[open]',p).forEach(d=>d.open=false);});if(changeHash)history.replaceState(null,'','#work-'+id);}
$$('[data-film]').forEach(b=>b.addEventListener('click',()=>selectFilm(b.dataset.film,true)));
$$('[data-play]').forEach(b=>b.addEventListener('click',()=>{const p=b.closest('.film-panel'),v=$('video',p),status=$('.film-status',p);pauseOthers(v);v.hidden=false;b.hidden=true;if(!v.getAttribute('src'))v.src=v.dataset.src;status.textContent='正在载入视频…';v.play().catch(()=>{if(!v.error)status.textContent='点击视频播放键继续观看。'});}));
$$('.film-panel video').forEach(v=>{const p=v.closest('.film-panel'),status=$('.film-status',p);let stall;v.addEventListener('play',()=>pauseOthers(v));v.addEventListener('loadedmetadata',()=>{if(v.videoWidth&&v.videoHeight)v.parentElement.style.aspectRatio=v.videoWidth+'/'+v.videoHeight;});v.addEventListener('playing',()=>{clearTimeout(stall);status.textContent='';});v.addEventListener('waiting',()=>{clearTimeout(stall);stall=setTimeout(()=>{if(!v.paused)status.textContent='正在缓冲，也可以通过上方链接打开平台原片。'},7000);});v.addEventListener('pause',()=>clearTimeout(stall));v.addEventListener('error',()=>{clearTimeout(stall);status.textContent='暂时未能载入，请重试或打开平台原片。';const button=$('[data-play]',p);button.hidden=false;$('span',button).textContent='重新播放';});});
$$('.case-study').forEach(group=>{
  const panels=$$('.film-panel',group),stage=document.createElement('div');
  stage.className='film-panels';panels[0].before(stage);panels.forEach(p=>{stage.append(p);p.setAttribute('aria-hidden',String(p.hidden));});
});
const workflowTabs=$$('.workflow-tabs button'),workflowPanels=$$('.workflow-panel');
function setStep(id){
  workflowTabs.forEach(b=>{const yes=b.dataset.step===id;b.setAttribute('aria-selected',yes);b.tabIndex=yes?0:-1;});
  workflowPanels.forEach(p=>{const hidden=p.id!=='panel-'+id;p.hidden=hidden;p.setAttribute('aria-hidden',String(hidden));});
}
workflowTabs.forEach(b=>b.addEventListener('click',()=>setStep(b.dataset.step)));
setStep('topic');
$$('[role=tablist]').forEach(list=>list.addEventListener('keydown',e=>{const tabs=$$('[role=tab]',list),at=tabs.indexOf(document.activeElement);if(at<0)return;let next;if(e.key==='ArrowRight')next=(at+1)%tabs.length;else if(e.key==='ArrowLeft')next=(at-1+tabs.length)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();tabs[next].focus();tabs[next].click();}));
const aliases={
  projects:'works', cases:'works', experience:'about', research:'tools',
  'content-research':'tools', practice:'ai', 'yingjun-oppo':'yingjun-reno'
};
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
function route(animate=false){
  let id=location.hash.slice(1)||new URLSearchParams(location.search).get('chapter');
  try{id=decodeURIComponent(id||'');}catch(e){return;}
  if(!id) return;
  const detailAnchors={
    'reno16-evidence':'#reno16-shots',
    'reno16-rewrite':'#reno16-shots',
    'reno16-workflow':'#reno16-workflow',
    'reno16-shots':'#reno16-shots',
    'reno16-timeline':'#reno16-timeline'
  };
  const detailAnchor=Object.hasOwn(detailAnchors,id)?detailAnchors[id]:null;
  const openReno16Evidence=Boolean(detailAnchor);
  id=openReno16Evidence?'work-yingjun-reno':(aliases[id]||id).replace(/^project-/,'work-');
  if(id.startsWith('panel-')&&workflowTabs.some(tab=>tab.dataset.step===id.slice(6)))setStep(id.slice(6));
  if(id.startsWith('work-')) selectFilm(id.slice(5));
  else if(groups.some(group=>group.films.some(film=>film.id===id))){
    selectFilm(id);
    id='work-'+id;
  }
  const panel=document.getElementById(id);
  if(!panel) return;
  if(openReno16Evidence) $('.film-details',panel).open=true;
  const target=detailAnchor?$(detailAnchor,panel):panel;
  requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:animate&&!reduce.matches?'smooth':'instant'}));
}
addEventListener('hashchange',()=>route(true));
route();
if('IntersectionObserver'in window){
  const visibleFilm=new IntersectionObserver(entries=>entries.forEach(e=>{
    const video=e.target;
    if(!e.isIntersecting&&document.fullscreenElement!==video&&document.pictureInPictureElement!==video)video.pause();
  }));
  $$('.film-panel video').forEach(video=>visibleFilm.observe(video));
  const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('is-visible');reveal.unobserve(e.target);}
  }),{threshold:.08});
  if(!reduce.matches)$$('.section-heading,.principles article,.tool-card').forEach(el=>{
    el.classList.add('reveal');reveal.observe(el);
  });

}
})();
