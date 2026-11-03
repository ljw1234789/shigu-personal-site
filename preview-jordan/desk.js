import * as THREE from '../assets/vendor/three.module.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#desk');
const entry = $('#entry');
const dialog = $('#detail');
const detail = $('#detail-body');
const menu = $('#navigation');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const projects = window.PERSONAL_SITE.projects;
const evidence = window.PROJECT_EVIDENCE;
const narrative = window.PORTFOLIO_NARRATIVE;
const tools = window.CREATIVE_TOOLS.filter(t => ['science', 'motion'].includes(t.id));
const order = ['dry-ice', 'coastline', 'behind'];
const images = { 'dry-ice': 'dry-ice-hd.jpg', coastline: 'coastline-hd.jpg', behind: 'behind-hd.jpg' };
const ASSETS = '../assets/projects/';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
let entered = false, paused = reduced.matches, enteringAt = 0, fallback = false;
let ready = false, hovered = null, pointerDown = null, scene, camera, renderer, light;
let frame = 0, lastTime = 0, activeTime = 0, drawAt = 0, viewZ = 0;
const pickables = [], objects = [], materials = [];
const mouse = new THREE.Vector2(10, 10);
const ray = new THREE.Raycaster();
const worldPoint = new THREE.Vector3();
let px = 0, py = 0, scrollGoal = 0;
const floorColor = '#babed0';
const interactionLabel = $('#hover-label');
const sectionStops = [
  [0, '刘俊威的创作桌面'], [4, '重新认识干冰白雾'], [11.2, '丈量一条海岸线'],
  [19.5, '一条视频的诞生'], [28, '创作工具'], [37.5, '关于我']
];

function setMenu(open) {
  menu.hidden = !open;
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
  $('#menu-toggle').setAttribute('aria-label', open ? '关闭导航' : '打开导航');
}
$('#menu-toggle').addEventListener('click', () => setMenu(menu.hidden));
$('#enter').addEventListener('click', () => {
  if (entered) return;
  entered = true; enteringAt = performance.now();
  entry.classList.add('is-gone');
  $('#menu-toggle').focus({preventScroll: true});
  document.body.classList.add('has-entered');
});
function jump(z) {
  setMenu(false);
  const max = document.documentElement.scrollHeight - innerHeight;
  scrollTo({top: z / 42 * max, behavior: reduced.matches || paused ? 'instant' : 'smooth'});
}
document.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => {
  const z=Number(b.dataset.jump);
  if (fallback) {
    setMenu(false);
    if(z>=37)return showAbout();
    if(z>=28)return showTools();
    if(z>0)return showIndex();
    return scrollTo({top:0,behavior:'instant'});
  }
  jump(z);
}));
$('#work-index').addEventListener('click', showIndex);
$('#motion-toggle').setAttribute('aria-pressed', String(paused));
$('#motion-toggle').textContent = paused ? '▷' : 'Ⅱ';
$('#motion-toggle').addEventListener('click', () => {
  paused = !paused;
  $('#motion-toggle').setAttribute('aria-pressed', String(paused));
  $('#motion-toggle').setAttribute('aria-label', paused ? '播放桌面动态' : '暂停桌面动态');
  $('#motion-toggle').textContent = paused ? '▷' : 'Ⅱ';
});
$('#close-detail').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  detail.innerHTML = ''; document.body.classList.remove('modal-open');
  $('#work-index').focus({preventScroll:true});
});
dialog.addEventListener('click', e => {
  if (e.target !== dialog) return;
  const b = dialog.getBoundingClientRect();
  if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) dialog.close();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if(!entered)$('#enter').click();
    setMenu(false);
  }
});
function show(html) {
  setMenu(false); detail.innerHTML = html;
  interactionLabel.classList.remove('is-visible');
  document.body.classList.add('modal-open');
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  detail.querySelector('h2')?.focus({preventScroll:true});
}
function showIndex() {
  show('<p class="case-kicker">毕导团队参与项目</p><h2 id="detail-heading" tabindex="-1">视频作品</h2><div class="index-list">' +
    order.map(id => {
      const p = projects.find(p => p.id === id);
      return '<button class="index-card" data-case="' + id + '"><img src="' + ASSETS + images[id] +
        '" alt="' + esc(p.name) + '"><strong>' + esc(p.name) + ' ↗</strong><span>我的参与：AI 辅助选题、脚本、剪辑与发布复盘</span></button>';
    }).join('') + '</div>');
}
function showCase(id) {
  const p = projects.find(p => p.id === id), e = evidence.projects[id], n = narrative[id];
  show('<div class="case-top"><div class="case-media"><img src="' + ASSETS + images[id] + '" alt="' + esc(p.title) +
    '"><button type="button" data-play="' + id + '" aria-label="播放' + esc(p.name) + '"><span class="play-circle">▶</span></button></div>' +
    '<div><p class="case-kicker">' + esc(p.type) + ' · ' + esc(p.date) + '</p><h2 id="detail-heading" tabindex="-1">' + esc(p.name) +
    '</h2><p class="case-intro">' + esc(p.copy) + '</p><div class="metrics">' +
    '<a href="' + e.bilibili.url + '" target="_blank" rel="noopener" title="2026.10.29 公开页面记录"><strong>' + esc(e.bilibili.views) +
    '</strong><small>B 站播放 ↗</small></a><a href="' + e.douyin.url + '" target="_blank" rel="noopener" title="2026.10.29 公开页面记录"><strong>' +
    esc(e.douyin.likes) + '</strong><small>抖音点赞 ↗</small></a></div><div class="source-links"><a href="' + e.bilibili.url +
    '" target="_blank" rel="noopener">在 B 站观看 ↗</a><a href="' + e.douyin.url + '" target="_blank" rel="noopener">在抖音观看 ↗</a></div></div></div>' +
    '<p class="role-line"><strong>我负责的部分</strong>' + esc(n.summary) + '</p><div class="steps">' +
    n.steps.map((s, i) => '<section class="step"><span>0' + (i + 1) + '</span><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p></section>').join('') + '</div>');
}
function showTool(id) {
  const t = tools.find(t => t.id === id);
  const visual = id === 'science'
    ? '<img class="tool-preview" src="' + ASSETS + 'science-workbench.jpg" alt="科普工作台实际界面">'
    : '<div class="tool-preview motion-preview"><span>MOTION</span><b>▶</b><span>LAB</span></div>';
  show('<div class="tool-layout">' + visual + '<div><p class="case-kicker">创作工具 · ' + esc(t.category) +
    '</p><h2 id="detail-heading" tabindex="-1">' + esc(t.name) + '</h2><p class="case-intro">' + esc(t.detail) +
    '</p><ul class="tool-features">' + t.features.map(s => '<li>' + esc(s) + '</li>').join('') +
    '</ul><a class="tool-action" href="' + esc(t.url) + '" target="_blank" rel="noopener">打开工具 <span>↗</span></a></div></div>');
}
function showTools() {
  show('<h2 id="detail-heading" tabindex="-1">创作工具</h2><div class="index-list">' +
    tools.map(t=>'<button class="index-card" data-tool="'+t.id+'"><strong>'+esc(t.name)+' ↗</strong><span>'+esc(t.summary)+'</span></button>').join('')+'</div>');
}
function showAbout() {
  show('<div class="about-layout"><div><p class="case-kicker">工作之外，保持好奇。</p><h2 id="detail-heading" tabindex="-1">我是<br>刘俊威。</h2>' +
    '<p class="about-role">短视频内容策划与剪辑</p><a class="text-link" href="https://github.com/ljw1234789" target="_blank" rel="noopener">我的 GitHub ↗</a></div>' +
    '<div><div class="about-tags">用好奇心，<br>做值得看完的内容。</div><p>工科背景让我习惯追问原理，做内容则让我学习如何把它讲清楚。</p>' +
    '<p>我曾在毕导团队参与科普视频制作，用 AI 辅助选题和脚本，也参与剪辑、发布与复盘。这里收录了三条参与项目，以及我围绕创作流程做的小工具。</p>' +
    '<button class="tool-action" type="button" data-index>查看我的作品 <span>↗</span></button></div></div>');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-case],[data-play],[data-index],[data-tool]');
  if (!b) return;
  if (b.hasAttribute('data-index')) return showIndex();
  if (b.hasAttribute('data-case')) return showCase(b.dataset.case);
  if (b.hasAttribute('data-tool')) return showTool(b.dataset.tool);
  const id = b.dataset.play, p = projects.find(p => p.id === id), media = b.closest('.case-media');
  const iframe = document.createElement('iframe');
  iframe.title = p.title;
  iframe.src = 'https://open.douyin.com/player/video?vid=' + p.video + '&autoplay=0';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  media.replaceChildren(iframe);
});
function perform(action) {
  if (!action) return;
  if (action.kind === 'case') showCase(action.id);
  if (action.kind === 'tool') showTool(action.id);
  if (action.kind === 'about') showAbout();
  if (action.kind === 'key') action.group.userData.pressedAt = performance.now();
}

function getScroll() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  scrollGoal = Math.min(42, Math.max(0, scrollY / max * 42));
  let index = 0;
  sectionStops.forEach((s, i) => { if (scrollGoal >= s[0]) index = i; });
  $('#section-number').textContent = '0' + (index + 1) + ' / 06';
  $('#section-name').textContent = sectionStops[index][1];
  $('#scroll-cue').style.opacity = scrollGoal < 1.2 ? '1' : '0';
}
addEventListener('scroll', getScroll, {passive:true});
canvas.addEventListener('pointermove', e => {
  px = e.clientX; py = e.clientY;
  mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  interactionLabel.style.left = px + 'px'; interactionLabel.style.top = py + 'px';
});
canvas.addEventListener('pointerleave', () => { mouse.set(10,10); hovered = null; interactionLabel.classList.remove('is-visible'); });
canvas.addEventListener('pointerdown', e => { pointerDown = {x:e.clientX,y:e.clientY,time:performance.now()}; });
canvas.addEventListener('pointerup', e => {
  if (!entered || !pointerDown || Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>13 || performance.now()-pointerDown.time>650) return;
  mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  perform(pick()?.userData.hitAction); pointerDown = null;
});

function pick() {
  if (!camera || !entered || dialog.open || !menu.hidden) return null;
  ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObjects(pickables, true)[0];
  if (!hit) return null;
  let o = hit.object;
  while (o && !o.userData.hitAction) o = o.parent;
  return o || null;
}
const material = (color, opts = {}) => {
  const m = new THREE.MeshStandardMaterial({color, roughness:.52, metalness:.04, ...opts});
  materials.push(m); return m;
};
let ivory, black, grey, white, gold, blue;
function rounded(w,h,d,r=.06) {
  const s = new THREE.Shape(), x=-w/2, y=-h/2;
  s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  const g = new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:6});
  g.translate(0,0,-d/2); return g;
}
function mesh(geo, mat) { const m=new THREE.Mesh(geo,mat); m.castShadow=true; m.receiveShadow=true; return m; }
function slab(parent,w,h,d,mat,r=.03) {
  const m=mesh(rounded(w,h,d,r),mat); m.rotation.x=-Math.PI/2; m.position.y=d/2; parent.add(m); return m;
}
function surface(parent,w,h,y,texture) {
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,roughness:.68,metalness:0,side:THREE.FrontSide}));
  m.rotation.x=-Math.PI/2; m.position.y=y; m.receiveShadow=true; parent.add(m); return m;
}
function createTexture(w,h,paint) {
  const c=document.createElement('canvas'); c.width=w; c.height=h; paint(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  t.anisotropy=renderer.capabilities.getMaxAnisotropy(); return t;
}
function cover(ctx,img,x,y,w,h) {
  const r=Math.max(w/img.width,h/img.height), sw=w/r, sh=h/r;
  ctx.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,w,h);
}
function shadow(parent,w,h,opacity=.18) {
  const t=createTexture(256,256,(c,W,H)=>{const g=c.createRadialGradient(W/2,H/2,10,W/2,H/2,W/2);g.addColorStop(0,'rgba(18,21,38,'+opacity+')');g.addColorStop(.5,'rgba(18,21,38,'+(opacity*.4)+')');g.addColorStop(1,'rgba(18,21,38,0)');c.fillStyle=g;c.fillRect(0,0,W,H);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.y=.008;parent.add(m);
}
function object(x,z,angle,action,label) {
  const g=new THREE.Group(); g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);
  g.userData.rest={x,z,y:0,ry:angle};g.userData.label=label;g.userData.reveal=0;
  if(action){g.userData.hitAction=action;pickables.push(g);}
  objects.push(g); return g;
}
function floorText(text,x,z,w=5,color='#464957',size=65) {
  const g=object(x,z,0,null,'');
  const t=createTexture(1400,180,(c,W,H)=>{c.fillStyle=color;c.font='500 '+size+'px DeskSerif, serif';c.textBaseline='middle';c.fillText(text,10,H/2);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*180/1400),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.y=.012;g.add(m);return g;
}
function polaroid(img,title,number,x,z,angle,id) {
  const w=4.6,h=3.8,g=object(x,z,angle,{kind:'case',id},'查看项目 ↗');
  shadow(g,w+1.6,h+1.4,.17);slab(g,w,h,.07,ivory,.025);
  const t=createTexture(1400,1156,(c,W,H)=>{
    c.fillStyle='#faf9f4';c.fillRect(0,0,W,H);
    cover(c,img,48,46,W-96,760);
    c.fillStyle='#202027';c.font='500 58px DeskSerif, serif';c.fillText(title,60,935);
    c.font='21px Arial';c.fillStyle='#737681';c.fillText('LIU JUNWEI / SELECTED WORK',64,1050);
    c.textAlign='right';c.fillText('0'+number+' — 03',W-62,1050);
  });
  surface(g,w-.015,h-.015,.075,t);return g;
}
function keyboard(text,x,z) {
  const root=object(x,z,-.16,null,'');shadow(root,6.1,3.2,.18);
  root.userData.mobileZOffset=text==='SCIENCE/FILM'?3.2:-3.8;
  const lines=text.split('/');
  lines.forEach((line,row)=>{
    [...line].forEach((letter,i)=>{
      const key=new THREE.Group();
      key.position.set((i-(line.length-1)/2)*.82,.03,(row-(lines.length-1)/2)*.9);
      key.userData.hitAction={kind:'key',group:key}; key.userData.label='按一下';
      slab(key,.77,.8,.17,black,.035);
      const t=createTexture(160,160,(c)=>{c.fillStyle='#eff0f5';c.textAlign='center';c.textBaseline='middle';c.font='400 70px Arial';c.fillText(letter,80,84);});
      surface(key,.73,.76,.177,t);root.add(key);pickables.push(key);
    });
  });return root;
}
function phone(img,x,z,id) {
  const root=object(x,z,.18,{kind:'case',id},'播放项目 ↗');shadow(root,4.6,6.8,.2);
  const phone=new THREE.Group();phone.position.y=.58;phone.rotation.x=-1.37;root.add(phone);
  phone.add(mesh(rounded(2.65,5.05,.23,.23),black));
  const tex=createTexture(720,1400,(c,W,H)=>{
    c.fillStyle='#101117';c.fillRect(0,0,W,H);cover(c,img,0,230,W,780);
    c.fillStyle='#eeeef5';c.font='31px DeskSerif, serif';c.fillText('丈量一条海岸线',45,1130);
    c.font='20px Arial';c.fillStyle='#a6a8b9';c.fillText('13:55 / 毕导团队参与项目',47,1190);
    c.strokeStyle='#fff9';c.lineWidth=2;c.beginPath();c.arc(W/2,620,70,0,Math.PI*2);c.stroke();
    c.fillStyle='#fffffff0';c.beginPath();c.moveTo(W/2-17,588);c.lineTo(W/2-17,652);c.lineTo(W/2+35,620);c.closePath();c.fill();
  });
  const scr=mesh(new THREE.PlaneGeometry(2.45,4.76),new THREE.MeshBasicMaterial({map:tex}));scr.position.z=.125;phone.add(scr);
  const speaker=mesh(rounded(.7,.09,.025,.04),black);speaker.position.set(0,2.28,.14);phone.add(speaker);
  const home=mesh(rounded(.65,.045,.01,.02),white);home.position.set(0,-2.25,.14);phone.add(home);
  return root;
}
function clapper(x,z) {
  const g=object(x,z,-.16,{kind:'case',id:'behind'},'查看幕后项目 ↗');shadow(g,5.6,4.1,.22);
  g.userData.mobileZOffset=1.5;
  slab(g,4.5,2.95,.13,black,.035);
  const t=createTexture(1200,780,(c,W,H)=>{
    c.fillStyle='#111216';c.fillRect(0,0,W,H);c.strokeStyle='#777b88';c.lineWidth=1;c.strokeRect(50,45,W-100,H-90);
    c.fillStyle='#e7e7e7';c.font='500 72px DeskSerif, serif';c.fillText('一条视频',85,310);c.fillText('的诞生',85,410);
    c.font='23px Arial';c.fillStyle='#a1a4ae';c.fillText('SELECTED WORK 03',86,625);c.fillText('AI / SCRIPT / EDIT',86,678);
  });
  surface(g,4.4,2.85,.137,t);
  const arm=new THREE.Group();arm.position.set(-2.16,.18,-1.49);g.add(arm);
  const bar=mesh(new THREE.BoxGeometry(4.5,.17,.55),black);bar.position.x=2.16;arm.add(bar);
  for(let i=0;i<9;i++){
    const s=mesh(new THREE.BoxGeometry(.23,.015,.55),white);s.position.set(.15+i*.49,.093,0);s.rotation.y=-.3;arm.add(s);
  }
  g.userData.arm=arm;return g;
}
function monitor(img,x,z) {
  const g=object(x,z,-.18,{kind:'tool',id:'science'},'打开科普工作台 ↗');shadow(g,7.0,5.6,.2);
  slab(g,2.5,1.6,.12,grey,.06);
  const stem=mesh(new THREE.CylinderGeometry(.12,.18,1.5,16),grey);stem.position.set(0,.86,-.3);g.add(stem);
  const display=new THREE.Group();display.position.set(0,2.5,-.38);display.rotation.x=-.2;g.add(display);
  display.add(mesh(rounded(5.5,3.6,.21,.12),black));
  const tex=new THREE.Texture(img);tex.needsUpdate=true;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const s=mesh(new THREE.PlaneGeometry(5.15,3.18),new THREE.MeshBasicMaterial({map:tex}));s.position.z=.12;display.add(s);
  return g;
}
function motionCard(x,z) {
  const g=object(x,z,.18,{kind:'tool',id:'motion'},'打开动效镜头库 ↗');shadow(g,5.4,4.8,.18);
  g.userData.mobileZOffset=2;
  slab(g,3.9,4.25,.22,blue,.12);
  const t=createTexture(1000,1090,(c,W,H)=>{
    c.fillStyle='#657da2';c.fillRect(0,0,W,H);c.fillStyle='#f2f2e9';c.font='bold 125px Arial';c.fillText('MOTION',62,210);c.fillText('LAB',62,360);
    c.lineWidth=2;c.strokeStyle='#dde1ea';c.strokeRect(65,440,870,370);
    for(let i=0;i<5;i++){c.globalAlpha=.13+i*.16;c.beginPath();c.moveTo(190+i*110,515);c.lineTo(190+i*110,735);c.lineTo(330+i*110,625);c.closePath();c.fill();}
    c.globalAlpha=1;c.font='47px DeskSerif,serif';c.fillText('动效镜头库',63,970);
    c.textAlign='right';c.font='65px Arial';c.fillText('↗',925,970);
  });
  surface(g,3.87,4.22,.228,t);return g;
}
function notebook(x,z) {
  const g=object(x,z,.12,{kind:'about'},'认识刘俊威 ↗');shadow(g,7.3,5.3,.19);
  slab(g,6.0,4.65,.15,grey,.035);
  const t=createTexture(1560,1200,(c,W,H)=>{
    c.fillStyle='#f3f2ec';c.fillRect(0,0,W,H);c.fillStyle='#272b33';c.font='500 122px DeskSerif,serif';c.fillText('用好奇心，',105,285);c.fillText('做值得看完的内容。',105,455);
    c.strokeStyle='#c1c2bf';c.beginPath();c.moveTo(110,580);c.lineTo(1450,580);c.stroke();
    c.font='43px DeskSerif,serif';c.fillText('刘俊威',112,735);
    c.font='29px Arial';c.fillStyle='#737982';c.fillText('短视频内容策划与剪辑',113,815);c.fillText('AI 辅助选题 / 脚本 / 剪辑 / 发布复盘',113,888);
    c.font='25px Arial';c.fillText('ABOUT ME',113,1090);c.textAlign='right';c.fillText('↗',1445,1090);
  });
  surface(g,5.97,4.62,.158,t);
  for(let i=0;i<11;i++){const ring=mesh(new THREE.TorusGeometry(.075,.014,5,12),grey);ring.position.set(-2.98,.15,-1.9+i*.38);ring.rotation.y=Math.PI/2;g.add(ring);}
  return g;
}
async function nameModel() {
  const response=await fetch('../assets/sculpture-v13/name-wordmark.bin');
  if(!response.ok)throw Error('姓名模型加载失败');
  const b=await response.arrayBuffer(),[n,count,scale,indexBytes]=new Uint32Array(b,0,4);
  const packed=new Int16Array(b,16,n*3),pos=new Float32Array(n*3);
  for(let i=0;i<pos.length;i++)pos[i]=packed[i]/scale;
  const offset=16+Math.ceil(packed.byteLength/4)*4;
  const ind=indexBytes===2?new Uint16Array(b,offset,count):new Uint32Array(b,offset,count);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(new THREE.BufferAttribute(ind,1));
  const normalOffset=offset+ind.byteLength;
  if(b.byteLength===normalOffset+n*6)g.setAttribute('normal',new THREE.BufferAttribute(new Int16Array(b,normalOffset,n*3),3,true));
  else g.computeVertexNormals();
  g.computeBoundingBox();g.center();
  const s=7.2/(g.boundingBox.max.x-g.boundingBox.min.x);g.scale(s,s,s*.72);
  const root=object(-2.1,-1.0,0,null,'');
  root.userData.identity=true;
  const m=mesh(g,material('#f7f7fa',{roughness:.33,metalness:.09}));m.rotation.x=-Math.PI/2;
  g.computeBoundingBox();m.position.y=(g.boundingBox.max.z-g.boundingBox.min.z)/2+.035;root.add(m);
  shadow(root,8.1,3.6,.12);
  const label=floorText('L I U   J U N W E I',-2.1,1.0,7.0,'#a88d4c',65);
  label.userData.identity=true;
  return [root,label];
}
function loadImage(src) {return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('无法加载 '+src));i.src=src;});}
function resize() {
  if(!renderer)return;
  const aspect=innerWidth/innerHeight,w=aspect<.8?8.6:10.5*aspect;
  camera.left=-w/2;camera.right=w/2;camera.top=w/aspect/2;camera.bottom=-w/aspect/2;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const mobile=aspect<.8;
  objects.forEach(g=>{
    g.position.x=mobile?(g.userData.identity?0:g.userData.rest.x*.52):g.userData.rest.x;
    g.position.z=g.userData.rest.z+(mobile?(g.userData.mobileZOffset||0):0);
    g.userData.size=mobile?.83:1;
  });
  getScroll();
}
function render(now) {
  frame=requestAnimationFrame(render);
  const dt=Math.min((now-lastTime)/1000||.016,.05);lastTime=now;
  if(document.hidden)return;
  if(reduced.matches && now-drawAt<80)return;
  drawAt=now;
  const still=paused||reduced.matches||dialog.open||!menu.hidden;
  if(!still)activeTime+=dt;
  viewZ=THREE.MathUtils.lerp(viewZ,scrollGoal,still?1:1-Math.exp(-dt*7));
  const intro=entered?ease((now-enteringAt)/1500):0;
  camera.zoom=reduced.matches?1:1.19-.19*intro;camera.updateProjectionMatrix();
  const mx=Math.abs(mouse.x)<2&&!still?mouse.x:0,my=Math.abs(mouse.y)<2&&!still?mouse.y:0;
  const cameraZ=viewZ+(innerWidth/innerHeight<.8?3.5:0);
  camera.position.set(mx*.19,18+my*.1,cameraZ+13);
  camera.lookAt(mx*.08,0,cameraZ);
  light.position.set(-9,19,cameraZ-9);light.target.position.set(0,0,cameraZ);
  const selected=pick();
  if(hovered!==selected){
    hovered=selected;
    interactionLabel.textContent=selected?.userData.label||'';
    interactionLabel.classList.toggle('is-visible',!!selected&&selected.userData.hitAction.kind!=='key');
    canvas.style.cursor=selected?'url("../assets/cursors/pointer.svg") 15 3, pointer':'';
  }
  objects.forEach(g=>{
    const target=entered&&Math.abs(g.userData.rest.z-viewZ)<21?1:0;
    g.userData.reveal=THREE.MathUtils.lerp(g.userData.reveal,target,still?1:1-Math.exp(-dt*4));
    const r=ease(g.userData.reveal),hover=hovered===g&&!still?1:0;
    g.position.y=THREE.MathUtils.lerp(g.position.y,g.userData.rest.y+(1-r)*.2+hover*.12,still?1:1-Math.exp(-dt*12));
    const s=(g.userData.size||1)*(.96+.04*r);g.scale.setScalar(s);
    g.rotation.y=THREE.MathUtils.lerp(g.rotation.y,g.userData.rest.ry+hover*mx*.025,.12);
    if(g.userData.arm)g.userData.arm.rotation.y=THREE.MathUtils.lerp(g.userData.arm.rotation.y,hover?-.18:0,.1);
  });
  pickables.forEach(g=>{
    if(g.userData.hitAction?.kind!=='key')return;
    const press=now-(g.userData.pressedAt||-1000)<170;
    g.position.y=THREE.MathUtils.lerp(g.position.y,press?-.035:hovered===g?.1:.03,.3);
  });
  renderer.render(scene,camera);
}
function useFallback(err) {
  console.warn('创作桌面使用静态作品浏览。',err?.message||err);
  fallback=true;$('#fallback').hidden=false;document.body.classList.add('has-fallback');
  $('#load-status').textContent='作品已就绪';canvas.dataset.state='fallback';
}
async function init() {
  try {
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    scene=new THREE.Scene();scene.background=new THREE.Color(floorColor);
    camera=new THREE.OrthographicCamera(-9,9,5, -5,.1,160);
    ivory=material('#f9f8f3');black=material('#111217',{roughness:.36,metalness:.12});
    grey=material('#a9acba',{roughness:.36,metalness:.32});white=material('#f7f7f8');
    gold=material('#b8a05c',{roughness:.3,metalness:.7});blue=material('#657da2',{roughness:.42});
    scene.add(new THREE.HemisphereLight('#ffffff','#a0a4bc',2.4));
    light=new THREE.DirectionalLight('#fffef8',3.1);light.castShadow=true;
    light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-18;light.shadow.camera.right=18;
    light.shadow.camera.top=16;light.shadow.camera.bottom=-16;light.shadow.camera.near=.5;light.shadow.camera.far=65;
    light.shadow.bias=-.00015;light.shadow.normalBias=.025;light.shadow.radius=4;
    scene.add(light,light.target);
    const fill=new THREE.DirectionalLight('#e5e9ff',.65);fill.position.set(6,8,4);scene.add(fill);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(250,250),material(floorColor,{roughness:1,metalness:0}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=true;scene.add(floor);
    resize();frame=requestAnimationFrame(render);
    await document.fonts.load('500 30px DeskSerif');
    const [dry,coast,behind,science]=await Promise.all([
      loadImage(ASSETS+images['dry-ice']),loadImage(ASSETS+images.coastline),loadImage(ASSETS+images.behind),loadImage(ASSETS+'science-workbench.jpg')
    ]);
    await nameModel();
    polaroid(dry,'重新认识干冰白雾',1,-3.45,4.6,.13,'dry-ice');
    keyboard('SCIENCE/FILM',2.65,4.1);
    polaroid(coast,'丈量一条海岸线',2,-3.45,13.2,-.11,'coastline');
    phone(coast,3.3,13.1,'coastline');
    polaroid(behind,'一条视频的诞生',3,-3.35,21.5,.1,'behind');
    clapper(3.1,21.4);
    monitor(science,-3.35,31.0);
    motionCard(3.35,30.4);
    floorText('科普工作台',-5.6,33.3,5,'#454b5d',65);
    floorText('把重复的步骤，做成工具。',-1.9,35.2,7,'#6d7283',45);
    notebook(-1.0,40.8);
    keyboard('LIU/JUNWEI',3.25,39.2);
    floorText('认识一下。',-2.0,37.4,5,'#454b5d',70);
    resize();ready=true;canvas.dataset.state='ready';
    $('#load-status').textContent='桌面已就绪';
  } catch(err) {if(frame)cancelAnimationFrame(frame);useFallback(err);}
}
addEventListener('resize',resize,{passive:true});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(frame)cancelAnimationFrame(frame);useFallback('WebGL context lost');});
getScroll();init();
