import * as THREE from '../assets/vendor/three.module.js';

const $ = s => document.querySelector(s);
const canvas = $('#desk'), entry = $('#entry'), menu = $('#navigation');
const inspector = $('#inspection'), actions = $('#inspection-actions'), video = $('#video-surface');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const projects = window.PERSONAL_SITE.projects;
const evidence = window.PROJECT_EVIDENCE.projects;
const narrative = window.PORTFOLIO_NARRATIVE;
const tools = window.CREATIVE_TOOLS.filter(t => ['science','motion'].includes(t.id));
const order = ['dry-ice','coastline','behind'];
const images = {'dry-ice':'dry-ice-hd.jpg',coastline:'coastline-hd.jpg',behind:'behind-hd.jpg'};
const videoTimes = {'dry-ice':'10:25',coastline:'13:55',behind:'03:43'};
const ASSETS = '../assets/projects/';
const MAX_TRAVEL = 62;
const VIEW_LEAD = 3.4;
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = t => Math.max(0,Math.min(1,t));
const outQuart = t => 1-Math.pow(1-clamp(t),4);
const outQuint = t => 1-Math.pow(1-clamp(t),5);
const inOut = t => (t=clamp(t))<.5?8*t*t*t*t:1-Math.pow(-2*t+2,4)/2;
const back = t => {t=clamp(t)-1;return 1+2.70158*t*t*t+1.70158*t*t;};
const bounce = t => {t=clamp(t);const n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d)return n*(t-=1.5/d)*t+.75;if(t<2.5/d)return n*(t-=2.25/d)*t+.9375;return n*(t-=2.625/d)*t+.984375;};
const damp = (a,b,s,dt) => THREE.MathUtils.lerp(a,b,1-Math.exp(-s*dt));
const objects=[],pickables=[],keys=[],identities=[],papers=[];
const projectPhotos = new Map();
const pointer = new THREE.Vector2(0,0),ray = new THREE.Raycaster();
const qBase = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/4,0,0));
const qFloorToFace = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
const qRig = new THREE.Quaternion(),qFace = new THREE.Quaternion(),qDrag = new THREE.Quaternion();
const vForward=new THREE.Vector3(),vTarget=new THREE.Vector3(),vCenter=new THREE.Vector3();
const vFit=new THREE.Vector3(),qFit=new THREE.Quaternion();
const sectionStops=[[0,'刘俊威的创作桌面'],[2.8,'重新认识干冰白雾'],[15,'丈量一条海岸线'],[29,'一条视频的诞生'],[43,'创作工具'],[57,'关于我']];
let scene,camera,renderer,light,ivory,black,grey,white,blue;
let ready=false,entered=false,enterAt=0,paused=reduced.matches,fallback=false;
let enterRequested=new URLSearchParams(location.search).get('enter')==='1';
let frame=0,lastTime=0,drawAt=0,scrollGoal=0,viewZ=0,scrollPosition=0;
let hover=null,down=null,dragYaw=0,dragPitch=0,cameraYaw=0,cameraPitch=0;
let active=null,focus=0,focusFrom=0,focusTo=0,focusAt=0,flip=0,flipTo=0;
let playing=false,uiReady=false,mobile=false;

function setMenu(open){
  if(open)closeObject();
  menu.hidden=!open;
  $('#menu-toggle').setAttribute('aria-expanded',String(open));
  $('#menu-toggle').setAttribute('aria-label',open?'关闭导航':'打开导航');
}
$('#menu-toggle').addEventListener('click',()=>setMenu(menu.hidden));
$('#work-index').addEventListener('click',()=>setMenu(true));
function enterDesk(){
  if((!scene&&!fallback)||entered)return;
  entered=true;enterAt=performance.now()+120;
  $('#asset-status').hidden=ready;
  canvas.dataset.phase='entering';
  entry.classList.add('is-gone');
  document.body.classList.add('has-entered','is-entering');
  $('#menu-toggle').focus({preventScroll:true});
  if(paused||reduced.matches||fallback)document.body.classList.remove('is-entering');
}
$('#enter').addEventListener('click',e=>{
  e.preventDefault();enterRequested=true;enterDesk();
});
function updateMotionButton(){
  const b=$('#motion-toggle');b.setAttribute('aria-pressed',String(paused));
  b.setAttribute('aria-label',paused?'播放桌面动态':'暂停桌面动态');b.textContent=paused?'▷':'Ⅱ';
}
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;updateMotionButton();});
reduced.addEventListener('change',()=>{paused=reduced.matches;updateMotionButton();});
updateMotionButton();
function jump(z){
  closeObject();setMenu(false);
  const max=document.documentElement.scrollHeight-innerHeight;
  // The camera already eases toward the scroll position. Avoid a second browser
  // animation that can keep moving after the visitor changes scroll direction.
  scrollTo({top:z/MAX_TRAVEL*max,behavior:'instant'});
}
document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>jump(Number(b.dataset.jump))));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(active)closeObject();else setMenu(false);}
});
function getScroll(){
  const next=scrollY;
  if(active&&Math.abs(next-scrollPosition)>2)closeObject();
  scrollPosition=next;
  const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  scrollGoal=clamp(next/max)*MAX_TRAVEL;
  let index=0;sectionStops.forEach((s,i)=>{if(scrollGoal>=s[0])index=i;});
  $('#section-number').textContent='0'+(index+1)+' / 06';
  $('#section-name').textContent=sectionStops[index][1];
  $('#scroll-cue').style.opacity=scrollGoal<1?'1':'0';
}
addEventListener('scroll',getScroll,{passive:true});

function setInspection(){
  if(!active)return;
  const d=active.userData,a=d.action;
  let name=d.title||'',html='',description='';
  if(a.kind==='case'){
    const p=projects.find(p=>p.id===a.id),n=narrative[a.id];name=p.name;
    html=(d.panel?'<button data-inspect="play">'+(playing?'关闭播放器 □':'播放成片 ▷')+'</button>':'')+
      (d.back?'<button data-inspect="flip">'+(flipTo?'回到封面 ↻':'我的贡献 ↻')+'</button>':'')+
      '<a href="'+evidence[a.id].bilibili.url+'" target="_blank" rel="noopener">B 站原片 ↗</a>';
    description=p.name+'。我的参与：'+n.summary+'。'+n.steps.map(s=>s[0]+'：'+s[1]).join('。');
  }else if(a.kind==='tool'){
    const t=tools.find(t=>t.id===a.id);name=t.name;description=t.detail;
    html=(d.back?'<button data-inspect="flip">'+(flipTo?'回到正面 ↻':'工具介绍 ↻')+'</button>':'')+
      '<a href="'+esc(t.url)+'" target="_blank" rel="noopener">打开'+esc(t.name)+' ↗</a>';
  }else if(a.kind==='about'){
    name='刘俊威 · 短视频内容策划与剪辑';description='工科背景，曾在毕导团队参与科普视频制作。用 AI 辅助选题、脚本、剪辑与发布复盘。';
    html='<a href="https://github.com/ljw1234789" target="_blank" rel="noopener">我的 GitHub ↗</a>';
  }
  actions.innerHTML=html+'<button data-inspect="close">收回桌面 ×</button>';
  $('#inspection-title').textContent=name;
  $('#inspection-description').textContent=description;
}
function inspectionCorners(g){
  g.updateWorldMatrix(true,true);
  const inverse=g.matrixWorld.clone().invert(),box=new THREE.Box3();
  g.traverse(node=>{
    if(!node.isMesh)return;
    node.geometry.computeBoundingBox();
    const b=node.geometry.boundingBox,m=inverse.clone().multiply(node.matrixWorld);
    for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])box.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(m));
  });
  const corners=[];
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])corners.push(new THREE.Vector3(x,y,z));
  return corners;
}
function openObject(g){
  if(!g||!g.userData.action||!ready||!entered)return;
  if(active&&active!==g){closeObject();return;}
  if(active===g)return;
  setMenu(false);active=g;focusFrom=0;focusTo=1;focusAt=performance.now();focus=0;
  g.userData.inspectionCorners=inspectionCorners(g);
  g.userData.focusStart={position:g.position.clone(),quaternion:g.quaternion.clone(),scale:g.scale.x};
  flip=flipTo=0;dragYaw=dragPitch=0;playing=false;uiReady=false;
  g.userData.revealAt=-1e6;g.visible=true;
  document.body.classList.add('is-inspecting');
  $('.desk-controls').inert=true;
  inspector.hidden=false;inspector.inert=false;inspector.removeAttribute('aria-hidden');setInspection();
  canvas.dataset.focus=g.userData.action.id||g.userData.action.kind;
  canvas.dataset.objectKind=g.userData.kind;
  canvas.dataset.phase='lifting';
  if(g.userData.device)startVideo();
}
function stopVideo(){playing=false;video.replaceChildren();video.hidden=true;}
function startVideo(){
  if(!active?.userData.panel)return;
  flipTo=0;dragYaw=dragPitch=0;playing=true;
  const p=projects.find(p=>p.id===active.userData.action.id);
  const iframe=document.createElement('iframe');iframe.title=p.title;
  const panel=active.userData.panel,vw=panel.viewportWidth||960,vh=panel.viewportHeight||600;
  iframe.width=String(vw);iframe.height=String(vh);
  iframe.style.width=vw+'px';iframe.style.height=vh+'px';
  iframe.setAttribute('scrolling','no');
  // The platform chooses its layout once at startup. Navigate only after the
  // projected screen is visible and its fixed viewport has been laid out.
  iframe.dataset.playerSrc='https://open.douyin.com/player/video?vid='+p.video+'&autoplay=1';
  iframe.allow='autoplay; fullscreen; picture-in-picture';iframe.allowFullscreen=true;
  video.replaceChildren(iframe);setInspection();
}
function closeObject(){
  if(!active||focusTo===0)return;
  stopVideo();inspector.classList.remove('is-ready');uiReady=false;
  inspector.inert=true;inspector.setAttribute('aria-hidden','true');
  active.userData.returnStart={position:active.position.clone(),quaternion:active.quaternion.clone(),scale:active.scale.x};
  focusFrom=focus;focusTo=0;focusAt=performance.now();
  canvas.dataset.phase='returning';
}
actions.addEventListener('click',e=>{
  const b=e.target.closest('[data-inspect]');if(!b||!active)return;
  if(b.dataset.inspect==='close')return closeObject();
  if(b.dataset.inspect==='flip'){
    stopVideo();flipTo=flipTo?0:1;dragYaw=dragPitch=0;setInspection();return;
  }
  if(b.dataset.inspect==='play'){
    if(playing){stopVideo();setInspection();return;}
    startVideo();
  }
});
document.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>{
  if(fallback)return window.open(evidence[b.dataset.case].bilibili.url,'_blank','noopener');
  openObject(projectPhotos.get(b.dataset.case));
}));

function cast(){
  if(!camera||!entered||!menu.hidden)return null;
  ray.setFromCamera(pointer,camera);
  const hit=ray.intersectObjects(pickables,true).find(h=>{
    let o=h.object;while(o&&!o.userData.owner)o=o.parent;
    return o?.userData.owner?.visible;
  });
  if(!hit)return null;
  let o=hit.object;while(o&&!o.userData.owner)o=o.parent;
  return {root:o.userData.owner,key:o.userData.key||null};
}
function point(e){pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);}
canvas.addEventListener('pointerdown',e=>{
  point(e);const hit=cast();down={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,hit,drag:false};
  if(active&&hit?.root===active&&!playing)canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  point(e);
  if(down&&active&&down.hit?.root===active&&!playing&&focus>.98){
    const dx=e.clientX-down.lastX,dy=e.clientY-down.lastY;
    if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)down.drag=true;
    if(down.drag){dragYaw+=dx*.004;dragPitch-=dy*.004;}
    down.lastX=e.clientX;down.lastY=e.clientY;
  }
});
canvas.addEventListener('pointerup',e=>{
  if(!down)return;const previous=down;down=null;
  if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  if(previous.drag||Math.hypot(e.clientX-previous.x,e.clientY-previous.y)>10)return;
  point(e);const hit=cast();
  if(active){if(hit?.root!==active)closeObject();return;}
  if(hit?.key)hit.key.userData.pressedAt=performance.now();
  if(hit?.root)openObject(hit.root);
});
canvas.addEventListener('pointercancel',()=>{down=null;});
canvas.addEventListener('pointerleave',()=>{if(!down)pointer.set(0,0);hover=null;});
canvas.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&!active){
    e.preventDefault();
    const candidates=objects.filter(g=>g.visible&&g.userData.action&&['paper','monitor','phone'].includes(g.userData.kind));
    candidates.sort((a,b)=>Math.abs(a.userData.rest.z-viewZ)-Math.abs(b.userData.rest.z-viewZ));
    openObject(candidates[0]);
  }
});

function material(color,opts={}){return new THREE.MeshStandardMaterial({color,roughness:.6,metalness:0,...opts});}
function mesh(geo,mat){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;return m;}
function rounded(w,h,d,r=.04,bevel=.012){
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  const g=new THREE.ExtrudeGeometry(s,{depth:d-2*bevel,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:5});
  g.translate(0,0,-(d-2*bevel)/2);return g;
}
function slab(parent,w,h,d,mat,r=.04){const m=mesh(rounded(w,h,d,r),mat);m.rotation.x=-Math.PI/2;m.position.y=d/2;parent.add(m);return m;}
function surface(parent,w,h,y,texture,unlit=false){
  const mat=unlit?new THREE.MeshBasicMaterial({map:texture,toneMapped:false}):material('#fff',{map:texture,roughness:.8});
  const m=mesh(new THREE.PlaneGeometry(w,h),mat);m.rotation.x=-Math.PI/2;m.position.y=y;parent.add(m);return m;
}
function texture(w,h,paint){
  const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
}
function cover(ctx,img,x,y,w,h){const r=Math.max(w/img.width,h/img.height),sw=w/r,sh=h/r;ctx.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,w,h);}
function wrap(c,text,x,y,width,lineHeight,maxLines=100){
  let line='',lines=0;
  for(const char of text){if(c.measureText(line+char).width>width&&line&&!/[，。！？：；、）】》”’]/.test(char)){c.fillText(line,x,y);y+=lineHeight;line='';if(++lines>=maxLines)return y;}line+=char;}
  if(line){c.fillText(line,x,y);y+=lineHeight;}return y;
}
function object(x,z,angle,action,title,kind='prop'){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;
  g.userData={rest:new THREE.Vector3(x,0,z),restQ:g.quaternion.clone(),action,title,kind,revealAt:null,scale:1,face:'floor',width:3,height:4.2,center:new THREE.Vector3()};
  g.userData.owner=g;g.visible=false;scene.add(g);objects.push(g);
  if(action)pickables.push(g);return g;
}
function contact(g,w,h,opacity=.17){
  const t=texture(128,128,(c,W,H)=>{const r=c.createRadialGradient(W/2,H/2,1,W/2,H/2,W/2);r.addColorStop(0,'rgba(51,52,78,1)');r.addColorStop(.5,'rgba(51,52,78,.35)');r.addColorStop(1,'rgba(51,52,78,0)');c.fillStyle=r;c.fillRect(0,0,W,H);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,opacity,depthWrite:false,toneMapped:false}));
  m.rotation.x=-Math.PI/2;m.position.set(g.position.x,.001,g.position.z);scene.add(m);g.userData.contact=m;g.userData.contactOpacity=opacity;
}
function caseBack(id){
  const p=projects.find(p=>p.id===id),n=narrative[id],e=evidence[id];
  return texture(1200,1680,(c,W,H)=>{
    c.fillStyle='#f7f6f0';c.fillRect(0,0,W,H);c.fillStyle='#777882';c.font='31px Arial';c.fillText('刘俊威 / 我负责的部分',88,100);
    c.fillStyle='#202127';c.font='500 65px DeskSerif,serif';let y=wrap(c,p.name,84,210,W-168,87,2)+20;
    c.font='35px Arial';c.fillStyle='#505563';y=wrap(c,n.summary,88,y,W-176,54)+30;
    c.strokeStyle='#cfd0d8';c.lineWidth=2;c.beginPath();c.moveTo(88,y);c.lineTo(W-88,y);c.stroke();y+=65;
    c.fillStyle='#202127';c.font='43px Arial';c.fillText(e.bilibili.views+' 播放',88,y);c.fillText(e.douyin.likes+' 赞',680,y);y+=75;
    n.steps.forEach((s,i)=>{c.fillStyle='#293039';c.font='500 40px DeskSerif,serif';c.fillText('0'+(i+1)+'  '+s[0],88,y);y+=55;c.fillStyle='#505661';c.font='36px Arial';y=wrap(c,s[1],88,y,W-176,54,4)+34;});
  });
}
function paper(front,backTexture,x,z,angle,action,title,w=3,h=4.2){
  const g=object(x,z,angle,action,title,'paper');
  const side=material('#dddde1',{roughness:.85});
  const frontMat=new THREE.MeshBasicMaterial({color:'#fff',map:front,toneMapped:false});
  const backMat=new THREE.MeshBasicMaterial({color:'#fff',map:backTexture,toneMapped:false});
  const geo=new THREE.BoxGeometry(w,.018,h,12,1,18);
  // BoxGeometry's underside is rotated to be readable when the paper turns over its long axis.
  if(backTexture){backTexture.center.set(.5,.5);backTexture.rotation=Math.PI;}
  const body=mesh(geo,[side,side,frontMat,backMat,side,side]);g.add(body);
  g.userData.paper={mesh:body,base:Float32Array.from(geo.attributes.position.array),bend:0};
  g.userData.width=w;g.userData.height=h;g.userData.back=!!backTexture;
  contact(g,w+1,h+.6,.17);papers.push(g);return g;
}
function polaroid(img,id,x,z,angle,caption,primary=true){
  const p=projects.find(p=>p.id===id);
  const t=texture(1200,1680,(c,W,H)=>{
    c.fillStyle='#f7f7f3';c.fillRect(0,0,W,H);
    cover(c,img,60,60,1080,1210);
    c.fillStyle='#15161c';c.font='500 64px DeskSerif,serif';c.textAlign='center';c.fillText(caption||p.name,W/2,1487,1080);
  });
  const g=paper(t,caseBack(id),x,z,angle,{kind:'case',id},p.name);
  g.userData.primary=primary;
  g.userData.panel={x:0,z:-.4375,w:2.7,h:3.025,y:.035};
  if(primary)projectPhotos.set(id,g);return g;
}
function note(id,x,z,angle){
  const p=projects.find(p=>p.id===id),n=narrative[id];
  const t=texture(1200,1680,(c,W,H)=>{
    c.fillStyle='#f9f8f3';c.fillRect(0,0,W,H);c.fillStyle='#797b84';c.font='30px Arial';c.fillText('我的参与',105,135);
    c.fillStyle='#252830';c.font='500 63px DeskSerif,serif';let y=wrap(c,p.name,100,285,1000,84,2)+70;
    c.font='40px DeskSerif,serif';c.fillStyle='#4b505d';y=wrap(c,n.summary,105,y,990,70)+70;
    c.font='37px DeskSerif,serif';n.steps.forEach(s=>{c.fillStyle='#242832';c.fillText(s[0],105,y);y+=57;c.fillStyle='#6e727b';c.font='32px DeskSerif,serif';y=wrap(c,s[1],105,y,990,53,3)+50;c.font='37px DeskSerif,serif';});
  });
  return paper(t,caseBack(id),x,z,angle,{kind:'case',id},p.name+' · 我的参与',2.8,4.2);
}
function keyboard(text,x,z,angle,action){
  const root=object(x,z,angle,action,text.replace('/',' '),'keyboard');
  const lines=text.split('/'),width=Math.max(...lines.map(l=>l.length))*.99;
  root.userData.width=width;root.userData.height=lines.length*.99;root.userData.center.set(0,.12,0);
  contact(root,width+1,lines.length+1,.16);
  const rim=material('#4e535e',{roughness:.27,metalness:.65});
  let n=0;
  lines.forEach((line,row)=>[...line].forEach((letter,i)=>{
    const key=new THREE.Group();key.position.set((i-(line.length-1)/2)*.99,.12,(row-(lines.length-1)/2)*.99);
    const angle=Math.sin(i*12.3+row*8.9)*.07;
    key.rotation.y=angle;key.userData={owner:root,key,rest:key.position.clone(),angle,index:n++,pressedAt:-1e6};
    slab(key,.93,.93,.055,rim,.025);slab(key,.9,.9,.225,black,.025);
    const t=texture(192,192,c=>{c.fillStyle='#eff0f6';c.textAlign='center';c.textBaseline='middle';c.font='400 85px Arial';c.fillText(letter,96,101);});
    const m=surface(key,.88,.88,.233,t);m.material.transparent=true;m.material.alphaTest=.02;
    root.add(key);keys.push(key);
  }));return root;
}
function phone(img,x,z,id,angle=-.3){
  const p=projects.find(p=>p.id===id);
  const g=object(x,z,angle,{kind:'case',id},p.name,'phone');
  g.userData.width=5.05;g.userData.height=2.95;g.userData.baseScale=.84;g.userData.device=true;
  slab(g,5.05,2.95,.24,black,.22);
  surface(g,4.72,2.66,.245,deviceCover(img,id,1440,810),true);
  slab(g,.08,.65,.014,black,.035).position.set(-2.46,.26,0);
  g.userData.panel={x:0,z:0,w:4.72,h:2.66,y:.27,viewportWidth:960,viewportHeight:575};contact(g,6,3.8,.19);return g;
}
function deviceCover(img,id,w,h){
  const p=projects.find(p=>p.id===id);
  return texture(w,h,(c,W,H)=>{
    c.fillStyle='#101219';c.fillRect(0,0,W,H);cover(c,img,0,0,W,H);
    const fade=c.createLinearGradient(0,H*.58,0,H);fade.addColorStop(0,'#10121900');fade.addColorStop(1,'#101219ec');
    c.fillStyle=fade;c.fillRect(0,0,W,H);c.fillStyle='#f4f4f7';c.font=Math.round(W*.042)+'px DeskSerif,serif';c.fillText(p.name,W*.055,H*.88,W*.89);
    c.fillStyle='#c9ced9';c.font=Math.round(W*.028)+'px Arial';c.fillText('点击观看 / '+videoTimes[id],W*.055,H*.945);
    const r=Math.min(W,H)*.082;c.strokeStyle='#fffd';c.lineWidth=2;c.beginPath();c.arc(W/2,H/2,r,0,Math.PI*2);c.stroke();
    c.fillStyle='#fff';c.beginPath();c.moveTo(W/2-r*.24,H/2-r*.42);c.lineTo(W/2-r*.24,H/2+r*.42);c.lineTo(W/2+r*.45,H/2);c.closePath();c.fill();
  });
}
function tablet(img,x,z,id,angle=.12){
  const p=projects.find(p=>p.id===id),g=object(x,z,angle,{kind:'case',id},p.name,'tablet');
  g.userData.width=5.05;g.userData.height=3.25;g.userData.device=true;
  slab(g,5.05,3.25,.18,grey,.2);slab(g,4.98,3.18,.19,black,.18);
  surface(g,4.69,2.93,.195,deviceCover(img,id,1440,900),true);
  const lens=mesh(new THREE.SphereGeometry(.026,12,8),grey);lens.position.set(0,.206,-1.55);g.add(lens);
  g.userData.panel={x:0,z:0,w:4.69,h:2.93,y:.215,viewportWidth:960,viewportHeight:600};
  contact(g,6,4.6,.19);return g;
}
function laptop(img,x,z,id,angle=-.1){
  const p=projects.find(p=>p.id===id),g=object(x,z,angle,{kind:'case',id},p.name,'laptop');
  g.userData.width=5.2;g.userData.height=5.6;g.userData.baseScale=.86;g.userData.face='upright';g.userData.center.set(0,1.82,-1.3);g.userData.device=true;
  slab(g,5.2,3.45,.15,grey,.1);
  const keyboard=texture(1040,690,(c,W,H)=>{
    c.fillStyle='#abb0bd';c.fillRect(0,0,W,H);c.fillStyle='#242831';
    for(let row=0;row<5;row++)for(let col=0;col<14;col++){c.beginPath();c.roundRect(80+col*63,67+row*57,54,44,6);c.fill();}
    c.strokeStyle='#858b99';c.lineWidth=2;c.beginPath();c.roundRect(362,420,316,200,14);c.stroke();
  });surface(g,5.1,3.35,.157,keyboard,true);
  const hinge=mesh(new THREE.CylinderGeometry(.085,.085,4.8,16),black);hinge.rotation.z=Math.PI/2;hinge.position.set(0,.2,-1.3);g.add(hinge);
  const screen=new THREE.Group();screen.position.copy(g.userData.center);screen.rotation.x=-.12;g.add(screen);
  screen.add(mesh(rounded(5.18,3.3,.12,.11),grey));
  const bezel=mesh(rounded(5.08,3.2,.13,.09),black);screen.add(bezel);
  const panel=mesh(new THREE.PlaneGeometry(4.85,2.96),new THREE.MeshBasicMaterial({map:deviceCover(img,id,1440,879),toneMapped:false}));panel.position.z=.071;screen.add(panel);
  g.userData.panel={frame:screen,x:0,y:0,z:.082,w:4.85,h:2.96,viewportWidth:960,viewportHeight:600};
  contact(g,6.3,4.6,.2);return g;
}
function clapper(x,z){
  const g=object(x,z,-.2,{kind:'case',id:'behind'},'一条视频的诞生','clapper');
  g.userData.width=3.8;g.userData.height=2.8;
  slab(g,3.8,2.5,.15,black);
  const t=texture(1200,800,(c,W,H)=>{
    c.fillStyle='#13141a';c.fillRect(0,0,W,H);c.fillStyle='#efeff4';c.font='500 87px DeskSerif,serif';c.fillText('一条视频的诞生',90,350,1040);
    c.strokeStyle='#737984';c.lineWidth=2;c.strokeRect(70,80,W-140,H-150);
    c.font='30px Arial';c.fillText('AI / SCRIPT / EDIT',90,650);
  });surface(g,3.76,2.46,.16,t);
  const arm=new THREE.Group();arm.position.set(-1.85,.18,-1.4);g.add(arm);
  const bar=mesh(new THREE.BoxGeometry(3.8,.16,.45),black);bar.position.x=1.85;arm.add(bar);
  for(let i=0;i<8;i++){const s=mesh(new THREE.BoxGeometry(.22,.012,.45),white);s.position.set(.15+i*.47,.087,0);s.rotation.y=-.25;arm.add(s);}
  g.userData.arm=arm;contact(g,4.7,3.8,.18);return g;
}
function monitor(img,x,z){
  const g=object(x,z,-.15,{kind:'tool',id:'science'},'科普工作台','monitor');
  g.userData.width=4;g.userData.height=2.65;g.userData.face='upright';g.userData.center.set(0,2.0,-.38);
  slab(g,2,1.5,.12,grey,.06);
  const stem=mesh(new THREE.CylinderGeometry(.12,.15,1.3,12),grey);stem.position.set(0,.72,-.68);g.add(stem);
  const screen=new THREE.Group();screen.position.set(0,2.0,-.38);g.add(screen);
  screen.add(mesh(rounded(4.1,2.8,.18,.12),black));
  const t=new THREE.Texture(img);t.needsUpdate=true;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
  const panel=mesh(new THREE.PlaneGeometry(3.86,2.47),new THREE.MeshBasicMaterial({map:t}));panel.position.z=.1;screen.add(panel);
  contact(g,5.6,4,.2);return g;
}
function motionCard(x,z){
  const t=texture(1200,1680,(c,W,H)=>{
    c.fillStyle='#71829f';c.fillRect(0,0,W,H);c.fillStyle='#f7f6ed';c.font='bold 147px Arial';c.fillText('MOTION',80,270);c.fillText('LAB',80,450);
    c.strokeStyle='#d8e1ed';c.lineWidth=2;c.strokeRect(85,610,1030,500);
    for(let i=0;i<5;i++){c.globalAlpha=.18+i*.16;c.beginPath();c.moveTo(190+i*155,730);c.lineTo(190+i*155,980);c.lineTo(340+i*155,855);c.closePath();c.fill();}
    c.globalAlpha=1;c.font='500 75px DeskSerif,serif';c.fillText('动效镜头库',85,1460);
  });
  const b=texture(1200,1680,(c,W,H)=>{
    c.fillStyle='#f7f6f0';c.fillRect(0,0,W,H);const t=tools.find(t=>t.id==='motion');c.fillStyle='#242932';c.font='500 78px DeskSerif,serif';c.fillText(t.name,100,230);
    c.font='43px DeskSerif,serif';let y=wrap(c,t.detail,100,440,1000,77)+100;c.font='39px DeskSerif,serif';t.features.forEach(f=>{c.fillText(f,100,y);y+=125;});
  });return paper(t,b,x,z,.22,{kind:'tool',id:'motion'},'动效镜头库');
}
function notebook(x,z){
  const t=texture(1560,1900,(c,W,H)=>{
    c.fillStyle='#f6f5f0';c.fillRect(0,0,W,H);c.fillStyle='#262b34';c.font='500 100px DeskSerif,serif';c.fillText('用好奇心，',135,290);c.fillText('做值得看完的内容。',135,450,1300);
    c.strokeStyle='#c8c9ce';c.beginPath();c.moveTo(140,600);c.lineTo(1420,600);c.stroke();
    c.font='65px DeskSerif,serif';c.fillText('刘俊威',140,810);c.font='45px DeskSerif,serif';c.fillText('短视频内容策划与剪辑',140,920);
    c.fillStyle='#5e6470';c.font='43px DeskSerif,serif';let y=wrap(c,'工科背景让我习惯追问原理，做内容则让我学习如何把它讲清楚。',140,1110,1240,80)+90;
    wrap(c,'曾在毕导团队参与科普视频制作，用 AI 辅助选题和脚本，也参与剪辑、发布与复盘。',140,y,1240,80);
  });return paper(t,null,x,z,-.12,{kind:'about'},'认识刘俊威',3.8,4.63);
}
function floorText(text,x,z,w,color='#b39d50',size=84){
  const g=object(x,z,0,null,text,'label');g.userData.width=w;g.userData.height=.3;
  const t=texture(1800,180,(c,W,H)=>{
    c.fillStyle=color;c.font='500 '+size+'px DeskSerif,serif';c.textBaseline='middle';
    const chars=[...text.replace(/\s/g,'')],total=chars.reduce((sum,ch)=>sum+c.measureText(ch).width,0),tracking=(W-100-total)/(chars.length-1);
    let x=50;chars.forEach(ch=>{c.fillText(ch,x,H/2);x+=c.measureText(ch).width+tracking;});
  });
  const m=surface(g,w,w*.1,.018,t,true);m.material.transparent=true;m.material.alphaTest=.02;
  return g;
}
async function nameModel(){
  const compressed=typeof DecompressionStream==='function';
  const response=await fetch(compressed?'name-wordmark.bin.gz':'../assets/sculpture-v13/name-wordmark.bin',{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('姓名模型加载失败');
  let b=await response.arrayBuffer();
  const magic=new Uint8Array(b,0,2);
  if(magic[0]===31&&magic[1]===139)b=await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const [n,count,scale,indexBytes]=new Uint32Array(b,0,4);
  const packed=new Int16Array(b,16,n*3),pos=new Float32Array(n*3);for(let i=0;i<pos.length;i++)pos[i]=packed[i]/scale;
  const offset=16+Math.ceil(packed.byteLength/4)*4;
  const ind=indexBytes===2?new Uint16Array(b,offset,count):new Uint32Array(b,offset,count);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setIndex(new THREE.BufferAttribute(ind,1));
  const normalOffset=offset+ind.byteLength;
  if(b.byteLength===normalOffset+n*6)geo.setAttribute('normal',new THREE.BufferAttribute(new Int16Array(b,normalOffset,n*3),3,true));else geo.computeVertexNormals();
  geo.computeBoundingBox();geo.center();const s=7.2/(geo.boundingBox.max.x-geo.boundingBox.min.x);geo.scale(s,s,s*.65);geo.computeBoundingBox();
  const p=geo.attributes.position.array,index=geo.index.array,parts=[[],[],[]];
  for(let i=0;i<index.length;i+=3){const x=(p[index[i]*3]+p[index[i+1]*3]+p[index[i+2]*3])/3;parts[x< -1.2?0:x<1.2?1:2].push(index[i],index[i+1],index[i+2]);}
  for(let i=objects.length-1;i>=0;i--){
    const old=objects[i];if(!old.userData.fallbackName)continue;
    scene.remove(old);objects.splice(i,1);
    old.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of [].concat(o.material)){m.map?.dispose();m.dispose();}}});
  }
  const root=object(-2.4,-1.05,0,null,'刘俊威','name');root.userData.width=7.2;root.userData.height=2.6;
  parts.forEach((indices,i)=>{
    const g=new THREE.BufferGeometry();g.setAttribute('position',geo.attributes.position);g.setAttribute('normal',geo.attributes.normal);g.setIndex(indices);
    const m=mesh(g,material('#fafaff',{roughness:.7,metalness:0}));m.rotation.x=-Math.PI/2;
    m.userData.depth=(geo.boundingBox.max.z-geo.boundingBox.min.z)/2;m.userData.index=i;root.add(m);identities.push(m);
  });contact(root,8.1,3.3,.13);
  const label=floorText('LIU JUNWEI',-2.4,.3,7.15);label.userData.identity=true;
  canvas.dataset.nameMode='sculpture';
}
function loadImage(src,timeout=6500){return new Promise((resolve,reject)=>{
  const i=new Image(),timer=setTimeout(()=>{i.onload=i.onerror=null;reject(Error('素材加载超时'));},timeout);
  i.onload=()=>{clearTimeout(timer);resolve(i);};i.onerror=()=>{clearTimeout(timer);reject(Error('无法加载 '+src));};i.src=src;
});}
function placeholderImage(label){
  const c=document.createElement('canvas');c.width=1200;c.height=1200;const ctx=c.getContext('2d');
  ctx.fillStyle='#dfe4ed';ctx.fillRect(0,0,1200,1200);ctx.fillStyle='#465873';ctx.font='500 85px DeskSerif,serif';wrap(ctx,label,100,480,1000,125);ctx.font='35px Arial';ctx.fillText('点击查看作品 ↗',100,1050);return c;
}
async function fallbackName(){
  if(objects.some(g=>g.userData.kind==='name'))return;
  const img=await loadImage('../assets/sculpture-v13/wordmark.svg',2500).catch(()=>null);
  if(objects.some(g=>g.userData.kind==='name'))return;
  const t=texture(1500,600,(c,W,H)=>{
    if(img){c.drawImage(img,0,0,W,H);c.globalCompositeOperation='source-in';c.fillStyle='#f6f6fa';c.fillRect(0,0,W,H);}
    else{c.fillStyle='#f6f6fa';c.font='500 400px DeskSerif,serif';c.textAlign='center';c.fillText('刘俊威',W/2,440);}
  });
  const root=object(-2.4,-1.05,0,null,'刘俊威','name');root.userData.fallbackName=true;const face=surface(root,7.2,2.88,.03,t,true);face.material.transparent=true;
  const label=floorText('LIU JUNWEI',-2.4,.9,7.15);label.userData.identity=true;label.userData.fallbackName=true;
  canvas.dataset.nameMode='vector';
}
function studioEnvironment(){
  const faces=Array.from({length:6},(_,i)=>{
    const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
    const gradient=ctx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#edf0fa');gradient.addColorStop(.55,i===3?'#9c9fae':'#9dabc1');gradient.addColorStop(1,'#424957');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
    if(i!==3){const glow=ctx.createRadialGradient(90,65,8,90,65,150);glow.addColorStop(0,'#fff');glow.addColorStop(.25,'#fff');glow.addColorStop(1,'#ffffff00');ctx.fillStyle=glow;ctx.fillRect(0,0,256,256);}
    if(i===2||i===0){ctx.fillStyle='#fff';ctx.fillRect(35,20,175,42);}return c;
  });
  const cube=new THREE.CubeTexture(faces);cube.colorSpace=THREE.SRGBColorSpace;cube.needsUpdate=true;
  const generator=new THREE.PMREMGenerator(renderer);scene.environment=generator.fromCubemap(cube).texture;scene.environmentIntensity=.65;
  cube.dispose();generator.dispose();
}
function resize(){
  if(!renderer)return;
  mobile=innerWidth/innerHeight<.8;camera.aspect=innerWidth/innerHeight;camera.fov=mobile?80:50;camera.updateProjectionMatrix();
  qBase.setFromEuler(new THREE.Euler(-THREE.MathUtils.degToRad(mobile?55:45),0,0));
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.7:2));renderer.setSize(innerWidth,innerHeight);
  objects.forEach(g=>{const d=g.userData;d.scale=(mobile?(d.kind==='name'?.79:d.kind==='keyboard'?.45:(d.device||d.kind==='monitor')?.54:.72):1)*(d.baseScale||1);});
  getScroll();
}
function compactX(d){
  const ratio=d.primary?.48:d.kind==='keyboard'?.43:(d.device||d.kind==='monitor')?.5:.64;
  return d.kind==='name'||d.identity?0:d.rest.x*ratio;
}
function restingPosition(g){
  const d=g.userData;
  return new THREE.Vector3(mobile?compactX(d):d.rest.x,d.rest.y,d.rest.z);
}
function setPaperBend(g,amount){
  const p=g.userData.paper;if(!p||Math.abs(p.bend-amount)<.0004)return;p.bend=amount;
  const a=p.mesh.geometry.attributes.position,b=p.base,h=g.userData.height,w=g.userData.width;
  for(let i=0;i<a.count;i++){const x=b[i*3],z=b[i*3+2],u=(z/h+.5);a.array[i*3+1]=b[i*3+1]+amount*(u*u+.1*x*x/(w*w));}
  a.needsUpdate=true;p.mesh.geometry.computeVertexNormals();
}
function cameraUpdate(now,dt,still){
  viewZ=still?scrollGoal:damp(viewZ,scrollGoal,6.5,dt);
  const intro=still?1:outQuint((now-enterAt)/3000);
  const targetY=mobile?9:7.5;
  camera.position.set(0,THREE.MathUtils.lerp(60,targetY,intro)+focus*(mobile?4.5:2.2),viewZ+THREE.MathUtils.lerp(-60,7.5+VIEW_LEAD,intro));
  const pitch=active||still?0:pointer.y*Math.PI*.05,yaw=active||still?0:pointer.x*-Math.PI*.1;
  cameraPitch=still?pitch:damp(cameraPitch,pitch,3,dt);cameraYaw=still?yaw:damp(cameraYaw,yaw,3,dt);
  qRig.setFromEuler(new THREE.Euler(cameraPitch,cameraYaw,0,'YXZ'));camera.quaternion.copy(qRig).multiply(qBase);
  camera.updateMatrixWorld();
  scene.fog.near=THREE.MathUtils.lerp(12,mobile?6:12,focus);
  scene.fog.far=THREE.MathUtils.lerp(25,mobile?16:25,focus);
  light.position.set(-5,18,viewZ+2);light.target.position.set(0,0,viewZ+2);light.target.updateMatrixWorld();
  if(entered&&now>enterAt+3050){
    document.body.classList.remove('is-entering');
    if(canvas.dataset.phase==='entering')canvas.dataset.phase='browsing';
  }
}
function renderObject(g,now,dt,still){
  const d=g.userData;
  if(d.revealAt===null&&entered&&(d.kind==='name'||d.rest.z<camera.position.z))d.revealAt=Math.max(now,enterAt+(d.kind==='name'?600:d.identity?1300:750));
  if(d.revealAt===null)return;
  const elapsed=still?1e5:Math.max(0,now-d.revealAt),progress=clamp(elapsed/2200);
  g.visible=elapsed>0;
  const base=restingPosition(g),qRest=d.restQ.clone(),s=d.scale;
  if(d.kind!=='name'&&d.kind!=='label'&&d.kind!=='keyboard'){
    base.x+=(Math.sign(d.rest.x)||1)*6*(1-outQuart(elapsed/2600));
    base.y+=(d.kind==='paper'?5:3)*(1-bounce(elapsed/1500));
    const twist=(1-outQuart(elapsed/1400));
    qRest.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(twist*.8,twist*.9,twist*.65)));
  }
  const isHover=hover===g&&!active&&!still;
  d.hoverMix=still?0:damp(d.hoverMix||0,isHover?1:0,7,dt);base.y+=d.hoverMix*.3;
  g.position.copy(base);g.quaternion.copy(qRest);g.scale.setScalar(s);
  if(d.kind==='label'){
    const r=still?1:outQuart(elapsed/1200);g.scale.y=Math.max(.001,r);g.scale.z=Math.max(.001,r)*s;
  }
  let bend=d.kind==='paper'?(1-outQuart(elapsed/2000))*.65+(isHover?-.15:.035):0;
  if(active===g){
    qDrag.setFromEuler(new THREE.Euler(dragPitch,dragYaw,0,'YXZ'));
    qFace.copy(camera.quaternion).multiply(qDrag);
    if(d.face==='floor')qFace.multiply(qFloorToFace);
    if(d.back)qFace.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),flip*Math.PI));
    const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const fitWidth=Math.max(.18,Math.min(mobile?.83:.72,1-2*(mobile?24:80)/innerWidth));
    const fitTop=Math.max(.18,Math.min(mobile?.66:.76,1-2*(mobile?140:76)/innerHeight));
    const fitBottom=Math.max(.18,Math.min(mobile?.64:.70,1-2*(mobile?150:100)/innerHeight));
    qFit.copy(camera.quaternion).invert().multiply(qFace);
    let distance=2;
    // Fit the entire object, including a laptop's keyboard and screen depth,
    // into the space between the header and the independent action row.
    for(const corner of d.inspectionCorners){
      vFit.copy(corner).sub(d.center).applyQuaternion(qFit);
      distance=Math.max(distance,vFit.z+Math.abs(vFit.x)/(tan*camera.aspect*fitWidth),vFit.z+(vFit.y>=0?vFit.y/fitTop:-vFit.y/fitBottom)/tan);
    }
    camera.getWorldDirection(vForward);
    vTarget.copy(camera.position).addScaledVector(vForward,distance);
    vCenter.copy(d.center).applyQuaternion(qFace);vTarget.sub(vCenter);
    if(focusTo){
      g.position.lerpVectors(d.focusStart.position,vTarget,focus);
      g.quaternion.slerpQuaternions(d.focusStart.quaternion,qFace,focus);
      g.scale.setScalar(THREE.MathUtils.lerp(d.focusStart.scale,1,focus));
    }else{
      const t=focusFrom?1-focus/focusFrom:1;
      g.position.lerpVectors(d.returnStart.position,base,t);
      g.quaternion.slerpQuaternions(d.returnStart.quaternion,qRest,t);
      g.scale.setScalar(THREE.MathUtils.lerp(d.returnStart.scale,s,t));
    }
    bend*=1-focus;
  }
  if(d.paper){d.bendValue=still?bend:damp(d.bendValue||0,bend,9,dt);setPaperBend(g,d.bendValue);}
  if(d.arm)d.arm.rotation.y=damp(d.arm.rotation.y,isHover?-.2:0,7,dt);
  if(d.contact){
    d.contact.visible=g.visible;d.contact.position.x=mobile?compactX(d):d.rest.x;
    d.contact.position.z=d.rest.z;d.contact.scale.setScalar(s);
    d.contact.material.opacity=d.contactOpacity*clamp(elapsed/1400)*(active===g?1-focus:1);
  }
  if(d.kind==='keyboard'){
    g.children.forEach(key=>{
      const k=key.userData;if(!k.key)return;
      const t=still?1e5:Math.max(0,elapsed-k.index*105);
      key.visible=t>0;key.position.copy(k.rest);
      key.position.x+=(Math.sign(d.rest.x)||1)*(5+Math.sin(k.index)*2)*(1-outQuart(t/2000));
      key.position.y+=4*(1-bounce(t/1500));
      const r=1-bounce(t/1500);key.rotation.set(r*.8,k.angle+r*1.5,r*.6);
      if(isHover&&t>2000)key.position.y+=.12*Math.sin(clamp((now-(d.hoverAt||now)-k.index*18)/350)*Math.PI/2);
      if(now-k.pressedAt<220)key.position.y-=.11*Math.sin(clamp((now-k.pressedAt)/220)*Math.PI);
    });
  }
}
function updateVideo(){
  if(!playing||!active||focus<.995||Math.abs(flip)>.005){video.hidden=true;return;}
  const panel=active.userData.panel;if(!panel)return;
  active.updateWorldMatrix(true,false);
  const points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>{
    const v=panel.frame?new THREE.Vector3(panel.x+x*panel.w/2,panel.y-z*panel.h/2,panel.z):new THREE.Vector3(panel.x+x*panel.w/2,panel.y,panel.z+z*panel.h/2);
    (panel.frame||active).localToWorld(v);v.project(camera);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};
  });
  const [p0,p1,p2,p3]=points,dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
  const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y,den=dx1*dy2-dx2*dy1;
  const a=den?(dx3*dy2-dx2*dy3)/den:0,b=den?(dx1*dy3-dx3*dy1)/den:0;
  const W=Math.round(Math.hypot(p1.x-p0.x,p1.y-p0.y)),H=Math.round(Math.hypot(p3.x-p0.x,p3.y-p0.y));
  const matrix=[(p1.x-p0.x+a*p1.x)/W,(p1.y-p0.y+a*p1.y)/W,0,a/W,(p3.x-p0.x+b*p3.x)/H,(p3.y-p0.y+b*p3.y)/H,0,b/H,0,0,1,0,p0.x,p0.y,0,1];
  video.style.width=W+'px';video.style.height=H+'px';video.style.transform='matrix3d('+matrix.join(',')+')';
  const iframe=video.querySelector('iframe'),vw=panel.viewportWidth||960,vh=panel.viewportHeight||600,fit=Math.min(W/vw,H/vh);
  if(iframe){
    iframe.style.width=vw+'px';iframe.style.height=vh+'px';
    iframe.style.transform='translate('+(W-vw*fit)/2+'px,'+(H-vh*fit)/2+'px) scale('+fit+')';
  }
  video.hidden=false;
  if(iframe&&!iframe.hasAttribute('src')&&!iframe.dataset.mounting){
    iframe.dataset.mounting='true';
    requestAnimationFrame(()=>{
      delete iframe.dataset.mounting;
      if(!iframe.isConnected||!playing||video.hidden)return;
      iframe.getBoundingClientRect();
      iframe.src=iframe.dataset.playerSrc;
    });
  }
}
function render(now){
  frame=requestAnimationFrame(render);const dt=Math.min((now-lastTime)/1000||.016,.05);lastTime=now;
  if(document.hidden)return;
  if(reduced.matches&&now-drawAt<60)return;drawAt=now;
  const still=paused||reduced.matches;
  if(active){
    const t=still?1:outQuart((now-focusAt)/(focusTo?800:1000));focus=THREE.MathUtils.lerp(focusFrom,focusTo,t);
    flip=still?flipTo:damp(flip,flipTo,7,dt);
    if(focusTo&&t===1&&!uiReady){uiReady=true;inspector.classList.add('is-ready');canvas.dataset.phase='inspecting';}
    if(!focusTo&&t===1){active=null;focus=0;flip=flipTo=0;inspector.hidden=true;document.body.classList.remove('is-inspecting');$('.desk-controls').inert=false;canvas.dataset.focus='';canvas.dataset.phase='browsing';}
  }
  cameraUpdate(now,dt,still);
  const selected=ready?cast():null;
  if(selected?.root!==hover){hover=selected?.root||null;if(hover)hover.userData.hoverAt=now;}
  canvas.style.cursor=active?(down?.drag?'grabbing':'grab'):(hover?'url("../assets/cursors/pointer.svg") 15 3, pointer':'');
  objects.forEach(g=>renderObject(g,now,dt,still));
  identities.forEach(m=>{
    const start=enterAt+1000+m.userData.index*333;
    m.visible=still||now>=start;
    const t=still?1:back((now-start)/1500);
    m.scale.z=Math.max(.001,t);m.position.y=.015+m.userData.depth*Math.max(.001,t);
  });
  renderer.render(scene,camera);updateVideo();
}
function useFallback(err){
  console.warn('创作桌面使用静态作品浏览。',err?.message||err);fallback=true;$('#fallback').hidden=false;document.body.classList.add('has-fallback');
  canvas.dataset.state='fallback';$('#load-status').hidden=true;$('#asset-status').hidden=true;ready=true;
  if(enterRequested)enterDesk();
}
async function init(){
  try{
    history.scrollRestoration='manual';scrollTo(0,0);
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    scene=new THREE.Scene();scene.background=new THREE.Color('#fff');scene.fog=new THREE.Fog('#fff',12,25);
    studioEnvironment();
    camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.08,180);
    ivory=material('#f5f5f8');black=material('#08090d',{roughness:.24,metalness:.25});grey=material('#a7acbb',{roughness:.3,metalness:.45});white=material('#fff');blue=material('#7285a5');
    scene.add(new THREE.HemisphereLight('#fff','#b8bbd0',2.1));
    light=new THREE.DirectionalLight('#fff',2.7);light.castShadow=true;light.shadow.mapSize.set(2048,2048);
    Object.assign(light.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:.1,far:40});light.shadow.bias=-.0002;light.shadow.normalBias=.012;light.shadow.radius=3;
    scene.add(light,light.target);const fill=new THREE.DirectionalLight('#c4d2f0',.4);fill.position.set(6,8,3);scene.add(fill);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(250,250),new THREE.MeshBasicMaterial({color:'#d5d6e1',toneMapped:false}));floor.rotation.x=-Math.PI/2;floor.position.y=-.035;scene.add(floor);
    const shadows=new THREE.Mesh(new THREE.PlaneGeometry(250,250),new THREE.ShadowMaterial({opacity:.19,color:'#676d87',depthWrite:false}));shadows.rotation.x=-Math.PI/2;shadows.position.y=-.03;shadows.receiveShadow=true;scene.add(shadows);
    resize();frame=requestAnimationFrame(render);canvas.dataset.state='loading';
    if(enterRequested)enterDesk();
    const nameTimer=setTimeout(()=>fallbackName(),1800);
    const nameTask=nameModel().catch(()=>fallbackName()).finally(()=>clearTimeout(nameTimer));
    await Promise.race([document.fonts.load('500 30px DeskSerif').catch(()=>[]),new Promise(resolve=>setTimeout(resolve,1800))]);
    const asset=(src,label)=>loadImage(src).catch(()=>placeholderImage(label));
    const [dry,coast,behind,science,dryDetail,coastDetail,behindDetail]=await Promise.all([
      asset(ASSETS+images['dry-ice'],'重新认识干冰白雾'),asset(ASSETS+images.coastline,'丈量一条海岸线'),asset(ASSETS+images.behind,'一条视频的诞生'),asset(ASSETS+'science-workbench.jpg','科普工作台'),
      asset('dry-ice-experiment-clean.png','实验里的白雾'),asset('coast-dimension-clean.png','海岸线的尺度'),asset('behind-ai-clean.png','从选题到成片')
    ]);
    polaroid(dry,'dry-ice',-3.3,4.95,-.2);
    keyboard('SCIENCE/FILM',3.3,5.7,.1,{kind:'case',id:'dry-ice'});
    note('dry-ice',-5.7,10.8,-.1);polaroid(dryDetail,'dry-ice',-.5,11.4,.1,'实验里的白雾',false);
    phone(dry,4.8,11.1,'dry-ice',-.23);
    keyboard('COAST/LINE',-3.5,18.0,-.15,{kind:'case',id:'coastline'});
    polaroid(coast,'coastline',3.3,18.2,.2);
    note('coastline',-5.2,24.4,.1);polaroid(coastDetail,'coastline',.3,24.5,-.12,'越细看，越长',false);
    tablet(coast,4.8,24.5,'coastline',.18);
    polaroid(behind,'behind',-3.3,32.0,-.15);
    keyboard('BEHIND/SCENES',3.3,32.3,.12,{kind:'case',id:'behind'});
    note('behind',-5.3,38.2,-.12);polaroid(behindDetail,'behind',.2,38.3,.17,'从选题到成片',false);
    laptop(behind,4.8,38.4,'behind',-.18);clapper(.8,42.9);
    keyboard('CREATIVE/TOOLS',-3.3,47.0,-.16,{kind:'tool',id:'science'});monitor(science,4.1,47.3);
    motionCard(-2.6,53.6);
    const scienceInfo=tools.find(t=>t.id==='science');
    const st=texture(1200,1680,(c,W,H)=>{c.fillStyle='#f9f8f3';c.fillRect(0,0,W,H);c.fillStyle='#2e3441';c.font='500 76px DeskSerif,serif';c.fillText('科普工作台',100,250);c.font='42px DeskSerif,serif';let y=wrap(c,scienceInfo.detail,100,480,1000,76)+110;scienceInfo.features.forEach(f=>{c.fillText(f,100,y);y+=130;});});
    paper(st,null,3.9,53.6,-.18,{kind:'tool',id:'science'},'科普工作台');
    notebook(-2.9,62);keyboard('LIU/JUNWEI',3.7,61.6,.12,{kind:'about'});
    resize();ready=true;canvas.dataset.state='ready';
    if(!entered)canvas.dataset.phase='waiting';
    $('#load-status').hidden=true;$('#asset-status').hidden=true;
    await nameTask;
  }catch(err){if(frame)cancelAnimationFrame(frame);useFallback(err);}
}
addEventListener('resize',resize,{passive:true});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(frame)cancelAnimationFrame(frame);useFallback('WebGL context lost');});
getScroll();init();
