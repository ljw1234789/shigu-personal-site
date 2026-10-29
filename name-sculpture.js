import * as THREE from './assets/vendor/three.module.js';
// Rounded membrane models, derived from OFL-licensed LXGW WenKai, not flat text extrusions.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const palettes={spring:['#43794d','#f1ffe8'],summer:['#3e63b3','#f2f7ff'],autumn:['#9d6525','#fff6da'],winter:['#7496bf','#ffffff']};
const staticMode=()=>reduced.matches||document.body.classList.contains('is-paused')||document.body.classList.contains('detail-open');
let models;
function loadModels(){return models??=Promise.all(['liu','jun','wei'].map(async key=>{
 const response=await fetch(new URL(`./assets/sculpture/${key}.bin?v=2`,import.meta.url));if(!response.ok)throw Error('Name model unavailable');
 const buffer=await response.arrayBuffer(),meta=new Uint32Array(buffer,0,2),raw=new Int16Array(buffer,8,meta[0]*3),positions=new Float32Array(raw.length);
 for(let i=0;i<raw.length;i++)positions[i]=raw[i]/30000;
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(buffer,8+raw.byteLength,meta[1]),1));geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}))}
function environment(renderer){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');
 const gradient=ctx.createLinearGradient(0,0,0,512);for(const [stop,color] of [[0,'#a9c7f4'],[.25,'#4268a5'],[.47,'#ebf3ff'],[.56,'#fff9e7'],[.72,'#637c9b'],[1,'#b9ccdf']])gradient.addColorStop(stop,color);
 ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,512);ctx.filter='blur(12px)';ctx.fillStyle='#ffffff';ctx.fillRect(100,30,115,300);ctx.fillRect(530,60,230,175);ctx.fillRect(890,100,70,280);
 const pixels=ctx.getImageData(0,0,1024,512).data,hdr=new Float32Array(pixels.length);for(let i=0;i<pixels.length;i+=4){const peak=Math.max(pixels[i],pixels[i+1],pixels[i+2])/255,gain=1+Math.pow(Math.max(0,(peak-.90)/.10),3)*3.2;for(let c=0;c<3;c++){const v=pixels[i+c]/255;hdr[i+c]=(v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4))*gain}hdr[i+3]=1}const texture=new THREE.DataTexture(hdr,1024,512,THREE.RGBAFormat,THREE.FloatType);texture.needsUpdate=true;texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.LinearSRGBColorSpace;const generator=new THREE.PMREMGenerator(renderer),target=generator.fromEquirectangular(texture);texture.dispose();generator.dispose();return target.texture;
}
class NameSculpture{
 constructor(host,canvas){this.host=host;this.canvas=canvas;this.visible=false;this.lost=false;this.raf=0;this.elapsed=0;this.entered=0;this.last=0;this.pointer={x:0,y:0,over:false};this.smooth={x:0,y:0};this.frame=this.frame.bind(this);this.schedule=this.schedule.bind(this);this.init()}
 async init(){try{
  const renderer=this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=this.scene=new THREE.Scene();scene.environment=environment(renderer);scene.environmentIntensity=1.2;
  const camera=this.camera=new THREE.OrthographicCamera(-2,2,1,-1,.1,20);camera.position.set(.06,.12,5);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight('#ffffff','#8a9ab7',.55));this.light=new THREE.DirectionalLight('#ffffff',2.2);this.light.position.set(-3,4,5);scene.add(this.light);const fill=new THREE.DirectionalLight('#d5e6ff',1.1);fill.position.set(4,-2,3);scene.add(fill);
  this.material=new THREE.MeshPhysicalMaterial({color:'#5b86df',metalness:.46,roughness:.20,clearcoat:1,clearcoatRoughness:.08,iridescence:.12,iridescenceIOR:1.3,envMapIntensity:1.5});
  this.group=new THREE.Group();scene.add(this.group);const geometries=await loadModels();geometries.forEach((geometry,i)=>{const mesh=new THREE.Mesh(geometry,this.material);mesh.position.x=(i-1)*.96;mesh.userData.pressure=0;this.group.add(mesh)});
  this.colorFrom=this.material.color.clone();this.colorTo=new THREE.Color();this.lightFrom=this.light.color.clone();this.lightTo=new THREE.Color();this.resize();this.season(true);this.visible=true;this.frame(performance.now());this.host.classList.add('ready');this.host.dataset.renderState='ready';this.host.dispatchEvent(new Event('sculpture-ready'));
  new ResizeObserver(()=>this.resize()).observe(this.host);
  new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible){this.last=0;this.schedule()}else{cancelAnimationFrame(this.raf);this.raf=0}},{rootMargin:'30px'}).observe(this.host);
  new MutationObserver(()=>this.season()).observe(document.documentElement,{attributes:true,attributeFilter:['data-season']});
  new MutationObserver(()=>{if(staticMode())this.pointer={x:0,y:0,over:false};this.schedule()}).observe(document.body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(this.schedule).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  this.host.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||staticMode())return;const r=this.host.getBoundingClientRect();this.pointer={x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5,over:true};this.schedule()},{passive:true});this.host.addEventListener('pointerleave',()=>{this.pointer={x:0,y:0,over:false}});
  reduced.addEventListener('change',this.schedule);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(this.raf);this.raf=0}else{this.last=0;this.schedule()}});
  this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;cancelAnimationFrame(this.raf);this.raf=0;this.host.classList.remove('ready');this.host.dataset.renderState='fallback'});this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.host.classList.add('ready');this.host.dataset.renderState='ready';this.schedule()});
  addEventListener('pagehide',()=>{cancelAnimationFrame(this.raf);this.raf=0});addEventListener('pageshow',()=>{this.last=0;this.schedule()});
 }catch(error){this.host.classList.remove('ready');this.host.dataset.renderState='fallback';this.renderer?.dispose();console.warn('Readable name fallback:',error.message)}}
 resize(){if(!this.renderer||!this.camera||this.lost)return;const r=this.host.getBoundingClientRect();if(!r.width||!r.height)return;const aspect=r.width/r.height,h=Math.max(1.25,3.3/aspect);Object.assign(this.camera,{left:-h*aspect/2,right:h*aspect/2,top:h/2,bottom:-h/2});this.camera.updateProjectionMatrix();this.renderer.setSize(r.width,r.height,false);this.schedule()}
 season(instant=false){if(!this.material)return;const [color,light]=palettes[document.documentElement.dataset.season]||palettes.autumn;this.colorFrom.copy(this.material.color);this.colorTo.set(color);this.lightFrom.copy(this.light.color);this.lightTo.set(light);this.transition=performance.now();if(instant||staticMode()){this.material.color.copy(this.colorTo);this.light.color.copy(this.lightTo);this.transition=0}this.schedule()}
 schedule(){if(!this.raf&&this.visible&&!document.hidden&&!this.lost)this.raf=requestAnimationFrame(this.frame)}
 frame(now){this.raf=0;if(!this.visible||document.hidden||this.lost||!this.group)return;
  const dt=Math.min(.05,(now-(this.last||now))/1000);this.last=now;const paused=staticMode(),pending=document.documentElement.classList.contains('intro-pending');
  if(!paused&&!pending)this.elapsed+=dt;if(!pending)this.entered=paused?1:Math.min(1,this.entered+dt/.95);const arrival=1-Math.pow(1-this.entered,3),bounce=Math.sin(this.entered*Math.PI)*.07;
  this.smooth.x+=(this.pointer.x-this.smooth.x)*.06;this.smooth.y+=(this.pointer.y-this.smooth.y)*.06;
  this.group.rotation.set(-.08+(paused?0:this.smooth.y*.09),-.14+(paused?0:this.smooth.x*.17),-.09+(paused?0:Math.sin(this.elapsed*.3)*.012));this.group.position.y=paused?0:Math.sin(this.elapsed*.55)*.021-(1-arrival)*.10;this.group.scale.setScalar(.94+.06*arrival);
  this.group.children.forEach((mesh,i)=>{const proximity=this.pointer.over?Math.max(0,1-Math.abs(this.pointer.x*3-(i-1))/.7):0;mesh.userData.pressure+=(proximity-mesh.userData.pressure)*.06;const p=paused?0:mesh.userData.pressure*.085;mesh.position.y=paused?0:Math.sin(this.elapsed*.55+i*.7)*.013;mesh.scale.set(1-p-bounce*.2,1+p+bounce,1+p);mesh.rotation.y=paused?0:Math.sin(this.elapsed*.5+i)*.025});
  this.scene.environmentRotation.y=paused?0:Math.sin(this.elapsed*.22)*.18;
  if(this.transition){const t=Math.min(1,(now-this.transition)/1150);this.material.color.lerpColors(this.colorFrom,this.colorTo,t);this.light.color.lerpColors(this.lightFrom,this.lightTo,t);if(t===1)this.transition=0}
  this.renderer.render(this.scene,this.camera);if(!paused||this.transition)this.schedule();
 }
}
const hero=document.getElementById('name-stage');if(hero)new NameSculpture(hero,document.getElementById('name-canvas'));
const footer=document.getElementById('footer-name-stage');if(footer){const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){observer.disconnect();new NameSculpture(footer,document.getElementById('footer-name-canvas'))}},{rootMargin:'500px'});observer.observe(footer)}
