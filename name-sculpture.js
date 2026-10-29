import * as THREE from './assets/vendor/three.module.js';
// Original geometry from the self-hosted, OFL-licensed Zhuque Fangsong glyphs.
const host=document.getElementById('name-stage'),canvas=document.getElementById('name-canvas');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const palettes={spring:['#b8db9f','#f4ffdc'],summer:['#a8cfed','#eefaff'],autumn:['#edc583','#fff1c5'],winter:['#b8c9d9','#ffffff']};
let renderer,scene,camera,group,material,light,raf=0,visible=true,lost=false,transitionStart=0;
let targetX=0,targetY=0,angleX=0,angleY=0,elapsed=0,last=0,entered=0;
let colorFrom=new THREE.Color(),colorTo=new THREE.Color(),lightFrom=new THREE.Color(),lightTo=new THREE.Color();
const staticMode=()=>reduced.matches||document.body.classList.contains('is-paused');
function makeShapes(commands){const p=new THREE.ShapePath();for(const [cmd,...a] of commands){if(cmd==='M')p.moveTo(...a);else if(cmd==='L')p.lineTo(...a);else if(cmd==='Q')p.quadraticCurveTo(...a);else if(cmd==='C')p.bezierCurveTo(...a);else if(cmd==='Z')p.currentPath.closePath()}return p.toShapes()}
function studioEnvironment(){
 const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');
 const gradient=x.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#f9fcff');gradient.addColorStop(.38,'#b6d5e9');gradient.addColorStop(.50,'#eff5f7');gradient.addColorStop(.58,'#152c49');gradient.addColorStop(.73,'#9dabb5');gradient.addColorStop(1,'#e3eaf1');x.fillStyle=gradient;x.fillRect(0,0,1024,512);
 x.filter='blur(13px)';x.fillStyle='#ffffff';x.fillRect(100,30,100,260);x.fillRect(600,80,240,135);x.fillRect(920,170,50,250);
 const tex=new THREE.CanvasTexture(c);tex.mapping=THREE.EquirectangularReflectionMapping;tex.colorSpace=THREE.SRGBColorSpace;
 const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromEquirectangular(tex);tex.dispose();pmrem.dispose();return env.texture;
}
function resize(){if(!renderer||lost)return;const r=host.getBoundingClientRect();if(!r.width||!r.height)return;const aspect=r.width/r.height;const height=Math.max(1.45,3.55/aspect);camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);schedule()}
function season(){if(!material)return;const [color,tint]=palettes[document.documentElement.dataset.season]||palettes.autumn;colorFrom.copy(material.color);lightFrom.copy(light.color);colorTo.set(color);lightTo.set(tint);transitionStart=performance.now();if(staticMode()){material.color.copy(colorTo);light.color.copy(lightTo);transitionStart=0}schedule()}
function schedule(){if(!raf&&visible&&!document.hidden&&!lost)raf=requestAnimationFrame(frame)}
function frame(now){
 raf=0;if(!visible||document.hidden||lost)return;
 const dt=Math.min(.05,(now-(last||now))/1000);last=now;
 const pending=document.documentElement.classList.contains('intro-pending');
 if(!staticMode()&&!pending)elapsed+=dt;
 if(!pending){entered=staticMode()?1:Math.min(1,entered+dt/1.15)}
 const progress=1-Math.pow(1-entered,3);
 angleX+=(targetX-angleX)*.065;angleY+=(targetY-angleY)*.065;
 group.rotation.set(-.10+(staticMode()?0:Math.sin(elapsed*.48)*.018+angleY*.055),-.12+(staticMode()?0:angleX*.065),-.035);
 group.position.y=staticMode()?0:Math.sin(elapsed*.65)*.022-(1-progress)*.16;
 group.scale.setScalar(.96+.04*progress);
 group.children.forEach((mesh,i)=>{if(mesh.userData.letter){mesh.position.y=staticMode()?0:Math.sin(elapsed*.6+i*.8)*.014;mesh.rotation.y=staticMode()?0:Math.sin(elapsed*.45+i)*.025}});
 if(transitionStart){const t=Math.min(1,(now-transitionStart)/1100);material.color.lerpColors(colorFrom,colorTo,t);light.color.lerpColors(lightFrom,lightTo,t);if(t===1)transitionStart=0}
 renderer.render(scene,camera);
 if(!staticMode()||transitionStart)schedule();
}
async function init(){
 try{
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  renderer.shadowMap.enabled=false;
  scene=new THREE.Scene();scene.environment=studioEnvironment();scene.environmentIntensity=1.1;
  camera=new THREE.OrthographicCamera(-2,2,1,-1,.1,20);camera.position.set(.10,.15,5);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight('#ffffff','#8c9ba6',.7));
  light=new THREE.DirectionalLight('#ffffff',1.6);light.position.set(-3,4,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-2.3;light.shadow.camera.right=2.3;light.shadow.camera.top=1.7;light.shadow.camera.bottom=-1.7;light.shadow.normalBias=.015;light.shadow.bias=-.0001;light.shadow.radius=5;scene.add(light);
  const fill=new THREE.DirectionalLight('#d2e7ff',1);fill.position.set(4,-1,3);scene.add(fill);
  material=new THREE.MeshPhysicalMaterial({color:'#c9dfe9',metalness:.84,roughness:.14,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.7});
  group=new THREE.Group();scene.add(group);
  const response=await fetch(new URL('./assets/name-sculpture.json',import.meta.url));if(!response.ok)throw Error('Name geometry unavailable');const glyphs=await response.json();
  [...'刘俊威'].forEach((char,i)=>{const geometry=new THREE.ExtrudeGeometry(makeShapes(glyphs[char]),{depth:.045,bevelEnabled:true,bevelThickness:.055,bevelSize:.022,bevelSegments:8,curveSegments:16,steps:1});geometry.center();const mesh=new THREE.Mesh(geometry,material);mesh.position.x=(i-1)*1.04;mesh.userData.letter=true;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)});
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=512;shadowCanvas.height=256;const sx=shadowCanvas.getContext('2d');sx.scale(2,1);const gradient=sx.createRadialGradient(128,128,0,128,128,120);gradient.addColorStop(0,'#253a4b35');gradient.addColorStop(.45,'#253a4b18');gradient.addColorStop(1,'#253a4b00');sx.fillStyle=gradient;sx.fillRect(0,0,256,256);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.8,1.5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.position.set(.04,-.18,-.22);scene.add(shadow);
  resize();season();renderer.render(scene,camera);host.classList.add('ready');host.dataset.renderState='ready';
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;schedule()}else{cancelAnimationFrame(raf);raf=0}},{rootMargin:'40px'}).observe(host);
  new MutationObserver(season).observe(document.documentElement,{attributes:true,attributeFilter:['data-season']});
  new MutationObserver(()=>{if(staticMode()){targetX=0;targetY=0;angleX=0;angleY=0}schedule()}).observe(document.body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  host.addEventListener('pointermove',event=>{if(staticMode()||event.pointerType==='touch')return;const r=host.getBoundingClientRect();targetX=(event.clientX-r.left)/r.width-.5;targetY=(event.clientY-r.top)/r.height-.5;schedule()},{passive:true});
  host.addEventListener('pointerleave',()=>{targetX=0;targetY=0});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else{last=0;schedule()}});
  reduced.addEventListener('change',()=>{targetX=0;targetY=0;schedule()});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;host.classList.remove('ready');host.dataset.renderState='fallback'});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;host.classList.add('ready');host.dataset.renderState='ready';schedule()});
  addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0});addEventListener('pageshow',()=>{last=0;schedule()});schedule();
 }catch(error){host.dataset.renderState='fallback';host.classList.remove('ready');renderer?.dispose();console.warn('3D name uses the readable text fallback:',error.message)}
}
init();
