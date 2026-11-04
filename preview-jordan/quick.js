/* A readable route independent of WebGL. Existing desk objects keep their own player. */
(() => {
  const host = document.getElementById('quick-reader');
  if (!host) return;
  const projects = window.PERSONAL_SITE.projects;
  const evidence = window.PROJECT_EVIDENCE.projects;
  const narrative = window.PORTFOLIO_NARRATIVE;
  const ids = ['dry-ice','coastline','behind'];
  const safe = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clock = value => Math.floor(value/60)+':'+String(Math.floor(value%60)).padStart(2,'0');
  let active = false, savedScroll = 0, returnFocus = null;

  document.getElementById('quick-cases').innerHTML = ids.map((id,i) => {
    const p=projects.find(p=>p.id===id),n=narrative[id],e=evidence[id];
    return `<article class="quick-case" id="work-${id}" aria-labelledby="quick-title-${id}">
      <header class="quick-case-heading"><span>${String(i+1).padStart(2,'0')} / ${safe(p.type)}</span><h2 id="quick-title-${id}">${safe(p.name)}</h2><p>${safe(p.copy)}</p></header>
      <div class="quick-case-core"><div class="quick-visual">
        <video id="quick-video-${id}" controls playsinline preload="none" poster="../assets/projects/${id}-hd.jpg" src="media/${id}.mp4?v=interview3" aria-label="${safe(p.name)}完整视频"></video>
        <div class="quick-play-actions"><button type="button" data-quick-play="${id}" data-play-mode="preview">看 30 秒片段 ▷</button><button type="button" data-quick-play="${id}" data-play-mode="full">播放完整版 ↗</button></div>
        <p class="quick-video-status" id="quick-status-${id}" role="status" aria-live="polite">${safe(n.preview.label)} · ${clock(n.preview.start)}—${clock(n.preview.end)}</p>
      </div><div class="quick-contribution"><h3>我负责的部分</h3><ol>${n.deliverables.map(([title,text])=>`<li><h4>${safe(title)}</h4><p>${safe(text)}</p></li>`).join('')}</ol></div></div>
      <div class="quick-results"><span>团队作品公开表现</span><p><strong>${safe(e.bilibili.views)}</strong> B 站播放</p><p><strong>${safe(e.douyin.likes)}</strong> 抖音点赞</p></div>
      <details class="quick-evidence"><summary>成片依据、反馈与来源 <span>＋</span></summary><div class="quick-evidence-body">
        <figure><img src="../${e.still.src}" alt="${safe(e.still.caption)}" width="945" height="540" loading="lazy"><figcaption>${e.still.time} · ${safe(e.still.caption)}</figcaption></figure>
        <div><h4>我关注的反馈</h4>${e.feedback.map(text=>`<p>${safe(text)}</p>`).join('')}<h4>下一步怎么改</h4><p>${safe(n.next)}</p></div>
        <p class="quick-scope">个人职责据已确认参与环节整理，成片定位用于核对画面；未提供原始草稿与逐次修改记录。数据沿用 2026.10.29 公开快照，属于团队作品表现。</p>
        <nav aria-label="${safe(p.name)}来源"><a href="${e.bilibili.url}" target="_blank" rel="noopener">B 站原片 ↗</a><a href="${e.douyin.url}" target="_blank" rel="noopener">抖音原片 ↗</a></nav>
      </div></details></article>`;
  }).join('');

  function status(id,text){document.getElementById('quick-status-'+id).textContent=text;}
  function stopVideos(release=false){
    host.querySelectorAll('video').forEach(v=>{
      v.pause();delete v.dataset.end;delete v.dataset.requestedStart;
      if(release){v.removeAttribute('src');v.load();}
    });
  }
  function play(id,mode){
    const v=document.getElementById('quick-video-'+id),p=narrative[id].preview;
    stopVideos();
    if(!v.getAttribute('src'))v.src='media/'+id+'.mp4?v=interview3';
    const start=mode==='preview'?p.start:0;
    v.dataset.requestedStart=String(start);
    if(mode==='preview')v.dataset.end=String(p.end);
    if(v.readyState>=1){v.currentTime=start;delete v.dataset.requestedStart;}
    status(id,mode==='preview'?'正在载入 30 秒片段…':'正在载入完整视频…');
    // Do not await metadata before play: the call must retain the initiating click.
    v.play().catch(()=>{if(active&&!v.error)status(id,'点击视频上的播放键继续。');});
  }
  ids.forEach(id=>{
    const v=document.getElementById('quick-video-'+id);
    v.addEventListener('loadedmetadata',()=>{if(v.dataset.requestedStart!==undefined){v.currentTime=Number(v.dataset.requestedStart);delete v.dataset.requestedStart;}});
    v.addEventListener('play',()=>{host.querySelectorAll('video').forEach(other=>{if(other!==v)other.pause();});});
    v.addEventListener('playing',()=>{status(id,v.dataset.end?'30 秒片段 · '+narrative[id].preview.label:'完整版 · '+projects.find(p=>p.id===id).name);});
    v.addEventListener('timeupdate',()=>{
      const end=Number(v.dataset.end);
      if(end&&v.currentTime>=end){v.pause();delete v.dataset.end;status(id,'30 秒片段播放结束，可继续看完整版。');}
    });
    v.addEventListener('waiting',()=>{if(!v.error)status(id,'正在缓冲视频…');});
    v.addEventListener('error',()=>{if(v.getAttribute('src'))status(id,'视频暂时未能载入，可重试播放或打开下方原片。');});
    v.addEventListener('ended',()=>status(id,'已播放完。'));
  });

  function open(id='',push=true){
    const valid=ids.includes(id)?id:'';
    if(!active){
      savedScroll=scrollY;returnFocus=document.activeElement;active=true;
      document.dispatchEvent(new CustomEvent('portfolio:quick-open'));
      document.body.classList.add('is-quick');host.hidden=false;
      document.getElementById('viewport').inert=true;
    }
    const hash=valid?'#work-'+valid:'#works';
    if(push&&location.hash!==hash)history.pushState({quick:true},'',location.pathname+location.search+hash);
    const target=valid?document.getElementById('work-'+valid):host;
    target.scrollIntoView({behavior:'instant',block:'start'});
    const heading=valid?document.getElementById('quick-title-'+valid):document.getElementById('quick-title');
    heading.tabIndex=-1;heading.focus({preventScroll:true});
  }
  function close(replace=true){
    if(!active)return;
    stopVideos(true);active=false;host.hidden=true;
    document.body.classList.remove('is-quick');document.body.dataset.enterDesk='1';
    document.getElementById('viewport').inert=false;
    if(replace)history.replaceState(null,'',location.pathname+location.search);
    scrollTo({top:savedScroll,behavior:'instant'});
    document.dispatchEvent(new CustomEvent('portfolio:quick-close'));
    if(returnFocus?.isConnected&&returnFocus.closest('#entry')===null)returnFocus.focus({preventScroll:true});
    else document.getElementById('quick-toggle').focus({preventScroll:true});
  }
  function route(){
    if(location.hash==='#works')open('',false);
    else if(location.hash.startsWith('#work-')&&ids.includes(location.hash.slice(6)))open(location.hash.slice(6),false);
    else close(false);
  }
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-quick]');
    if(trigger){event.preventDefault();open(trigger.dataset.quick);return;}
    if(event.target.closest('[data-quick-close]')){event.preventDefault();close();return;}
    const playButton=event.target.closest('[data-quick-play]');
    if(playButton)play(playButton.dataset.quickPlay,playButton.dataset.playMode);
    const share=event.target.closest('[data-quick-share]');
    if(share)navigator.clipboard.writeText('https://ljw1234789.github.io/shigu-personal-site/?v=desk-main1').then(()=>{share.textContent='链接已复制 ✓';}).catch(()=>{share.textContent='请复制地址栏链接';});
  });
  document.addEventListener('keydown',event=>{if(active&&event.key==='Escape'&&!document.fullscreenElement){event.preventDefault();close();}});
  addEventListener('popstate',route);addEventListener('hashchange',route);
  window.PORTFOLIO_QUICK={open,close,get active(){return active;}};
  route();
})();
