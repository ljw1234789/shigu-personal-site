import * as THREE from './assets/vendor/three.module.js';
import {SkyLight} from './sky-light.js?v=optics-20261030-5';
import {createGlassMaterial,GlassFinish} from './glass-optics.js?v=optics-20261030-5';
// Original inflated meshes and procedural light; no model or artwork from the reference site.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const stopped=()=>reduced.matches||document.body.classList.contains('is-paused')||document.body.classList.contains('detail-open');
// Both visible scenes sample one optical clock; pausing never jumps the light.
const opticalEpoch=performance.now();let opticalPauseAt=null,opticalPausedTotal=0;
function opticalTime(){const now=performance.now();if(stopped()||document.hidden){if(opticalPauseAt===null)opticalPauseAt=now;}else if(opticalPauseAt!==null){opticalPausedTotal+=now-opticalPauseAt;opticalPauseAt=null;}return ((opticalPauseAt??now)-opticalEpoch-opticalPausedTotal)/1000;}
new MutationObserver(opticalTime).observe(document.body,{attributes:true,attributeFilter:['class']});document.addEventListener('visibilitychange',opticalTime);reduced.addEventListener('change',opticalTime);
const geometries=new Map();
function entryEase(x){x=THREE.MathUtils.clamp(x,0,1);let lo=0,hi=1,t=x;for(let i=0;i<15;i++){const at=3*.66*t*(1-t)**2+3*.01*t*t*(1-t)+t**3;if(at<x)lo=t;else hi=t;t=(lo+hi)/2}return t*t*(3-2*t)}
function loadGeometry(key){
 if(!geometries.has(key))geometries.set(key,(async()=>{
  const response=await fetch(new URL(`./assets/sculpture-v2/${key}.bin?v=refined-20261030-2`,import.meta.url));if(!response.ok)throw new Error('Lettering asset unavailable');
  const buffer=await response.arrayBuffer(),[n,count,scale,indexBytes]=new Uint32Array(buffer,0,4),packed=new Int16Array(buffer,16,n*3),pos=new Float32Array(n*3);
  for(let i=0;i<pos.length;i++)pos[i]=packed[i]/scale;
  const offset=16+Math.ceil(packed.byteLength/4)*4,index=indexBytes===2?new Uint16Array(buffer,offset,count):new Uint32Array(buffer,offset,count);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));geometry.setIndex(new THREE.BufferAttribute(index,1));geometry.computeVertexNormals();
  // Fair the optical normals along connected faces; preserve every outline and hole.
  // This removes tiny highlight breaks on the quantized inflated surface.
  const normals=geometry.attributes.normal.array,degree=new Float32Array(n);
  for(let i=0;i<index.length;i++)degree[index[i]]+=2;
  for(let pass=0;pass<3;pass++){const sums=new Float32Array(normals.length);
   for(let i=0;i<index.length;i+=3){const a=index[i]*3,b=index[i+1]*3,c=index[i+2]*3;for(let k=0;k<3;k++){sums[a+k]+=normals[b+k]+normals[c+k];sums[b+k]+=normals[a+k]+normals[c+k];sums[c+k]+=normals[a+k]+normals[b+k];}}
   for(let i=0;i<n;i++){const at=i*3,d=Math.max(1,degree[i]);let x=normals[at]*.6+sums[at]/d*.4,y=normals[at+1]*.6+sums[at+1]/d*.4,z=normals[at+2]*.6+sums[at+2]/d*.4;const length=Math.hypot(x,y,z)||1;normals[at]=x/length;normals[at+1]=y/length;normals[at+2]=z/length;}}
  geometry.attributes.normal.needsUpdate=true;geometry.computeBoundingSphere();return geometry;
 })());return geometries.get(key);
}
// Shared procedural backdrop, sampled by the lettering too so the image bends through the surface.
const skyFunctions=`uniform sampler2D uSkyMap;vec3 skyAt(vec2 uv){return texture2D(uSkyMap,clamp(uv,0.,1.)).rgb;}`;
const cloudVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy*2.,1.,1.);}`;
const cloudFragment=`varying vec2 vUv;${skyFunctions}void main(){gl_FragColor=vec4(skyAt(vUv),1.);#include <colorspace_fragment>}`.replace('#include','\n#include');
function skyUniforms(){return {uSkyMap:{value:null},uTime:{value:0},uAspect:{value:1}};}
const letteringMaterial=createGlassMaterial;
class SculptureScene{
 constructor(host,canvas,footer=false){this.host=host;this.canvas=canvas;this.footer=footer;this.visible=false;this.lost=false;this.raf=0;this.time=0;this.last=0;this.entryStarted=!document.documentElement.classList.contains('intro-pending');this.pointer=new THREE.Vector2(0,0);this.target=new THREE.Vector2(0,0);this.hover=false;this.pressure=0;this.frame=this.frame.bind(this);this.schedule=this.schedule.bind(this);document.addEventListener('portfolio:intro-prepare',()=>{this.entryStarted=true;this.schedule()},{once:true});this.init();}
 async init(){try{
  this.entryAge=this.footer||this.entryStarted?1.2:0;this.canvas.classList.add('portfolio-scene-canvas');this.canvas.setAttribute('aria-hidden','true');document.body.prepend(this.canvas);
  this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:false,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.06;
  this.sceneTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.UnsignedByteType,depthBuffer:true});
  this.finish=new GlassFinish(this.sceneTarget.texture);this.finishCamera=this.finish.camera;
  this.paperScene=new THREE.Scene();this.paperMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,uniforms:{uOpacity:{value:0},uSize:{value:new THREE.Vector2(1280,720)},uPaper:{value:new THREE.Color('#f9f8f0')}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`varying vec2 vUv;uniform float uOpacity;uniform vec2 uSize;uniform vec3 uPaper;void main(){vec2 cell=fract(vUv*uSize/4.);float d=distance(cell,vec2(.5)),r=.9*uOpacity,aa=fwidth(d)*1.5;float a=1.-smoothstep(r-aa,r+aa,d);if(uOpacity<.001)a=0.;gl_FragColor=vec4(uPaper,a);\n#include <colorspace_fragment>\n}`});this.paperScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.paperMaterial));
  this.sky=new SkyLight();this.skyPointer=new THREE.Vector2(.5,.5);this.lightAngle=Math.atan2(9,4);this.lightRay=new THREE.Raycaster();this.lightPlane=new THREE.Plane(new THREE.Vector3(0,0,1),0);this.lightHit=new THREE.Vector3();
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(35,1,.1,100);this.camera.position.set(0,0,24);
  this.background=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({vertexShader:cloudVertex,fragmentShader:cloudFragment,uniforms:skyUniforms(),depthWrite:false,depthTest:false,toneMapped:false}));this.background.position.z=-5;this.background.renderOrder=-10;this.scene.add(this.background);
  this.scene.add(new THREE.HemisphereLight('#e8f2ff','#e2d4bd',.45));const key=new THREE.DirectionalLight('#fffaf0',1.6);key.position.set(-4,4,6);this.scene.add(key);const fill=new THREE.DirectionalLight('#c8dfff',.8);fill.position.set(5,1,2);this.scene.add(fill);
  this.group=new THREE.Group();this.scene.add(this.group);this.materials=[];this.group.rotation.set(this.footer?-Math.PI:0,this.footer?0:this.entryStarted?THREE.MathUtils.degToRad(4):THREE.MathUtils.degToRad(240),0);
  if(this.footer){
   const specs=[['craft',1.12,-.04,'#ffffff','#9dceeb'],['and',0,.06,'#009dff','#ffffff'],['taste',-1.12,.02,'#38afff','#009dff']];
   const models=await Promise.all(specs.map(s=>loadGeometry(s[0])));specs.forEach(([key,y,z,top,bottom],i)=>{const m=letteringMaterial(top,bottom);models[i].computeBoundingBox();m.uniforms.uYRange.value.set(models[i].boundingBox.min.y,models[i].boundingBox.max.y);this.materials.push(m);const mesh=new THREE.Mesh(models[i],m);mesh.position.y=y;mesh.rotation.z=z;mesh.scale.y=.85;mesh.position.z=i===1?.25:0;this.group.add(mesh);});
  }else{const m=letteringMaterial('#009dff','#ffffff');const geometry=await loadGeometry('name');geometry.computeBoundingBox();m.uniforms.uYRange.value.set(geometry.boundingBox.min.y,geometry.boundingBox.max.y);this.materials.push(m);this.group.add(new THREE.Mesh(geometry,m));}
  this.background.material.uniforms.uSkyMap.value=this.sky.texture;this.materials.forEach(m=>m.uniforms.uSkyMap.value=this.sky.texture);this.visible=true;this.resize();this.frame(performance.now());this.host.classList.add('ready');this.canvas.classList.add('is-ready');this.host.dataset.renderState='ready';
  new ResizeObserver(()=>this.resize()).observe(this.host);
  new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.canvas.style.visibility=this.visible?'visible':'hidden';if(this.visible){this.last=0;this.schedule();}else{cancelAnimationFrame(this.raf);this.raf=0;}},{rootMargin:'50px'}).observe(this.host);
  const target=this.host.parentElement;target.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||stopped())return;const r=this.host.getBoundingClientRect();this.target.set((e.clientX-r.left)/r.width-.5,.5-(e.clientY-r.top)/r.height);this.hover=true;this.schedule();},{passive:true});target.addEventListener('pointerleave',()=>{this.target.set(0,0);this.hover=false;});
  new MutationObserver(()=>{if(stopped()){this.target.set(0,0);this.hover=false;}this.schedule();}).observe(document.body,{attributes:true,attributeFilter:['class']});new MutationObserver(this.schedule).observe(document.documentElement,{attributes:true,attributeFilter:['class']});reduced.addEventListener('change',this.schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(this.raf);this.raf=0;}else{this.last=0;this.schedule();}});
  addEventListener('scroll',this.schedule,{passive:true});addEventListener('resize',()=>this.resize());
  this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;cancelAnimationFrame(this.raf);this.raf=0;this.host.classList.remove('ready');this.canvas.classList.remove('is-ready');this.host.dataset.renderState='fallback';});this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.host.classList.add('ready');this.canvas.classList.add('is-ready');this.host.dataset.renderState='ready';this.schedule();});
  addEventListener('pagehide',()=>{cancelAnimationFrame(this.raf);this.raf=0;});addEventListener('pageshow',()=>{this.last=0;this.schedule();});
 }catch(error){this.host.classList.remove('ready');this.host.dataset.renderState='fallback';this.sky?.dispose();this.renderer?.dispose();console.warn('Readable lettering fallback:',error.message);}}
 resize(){if(!this.camera||this.lost)return;const r={width:innerWidth,height:innerHeight};if(!r.width||!r.height)return;this.aspect=r.width/r.height;this.height=Math.max(this.footer?6.2:6.,(this.footer?5.6:7.3)/this.aspect);this.width=this.height*this.aspect;this.mobile=r.width<600;const horizontalFov=THREE.MathUtils.degToRad(r.width<1024?38:60);this.camera.aspect=this.aspect;this.camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(horizontalFov/2)/this.aspect));this.worldFit=(2*24*Math.tan(horizontalFov/2)/this.aspect)/this.height;this.camera.updateProjectionMatrix();this.renderer.setSize(r.width,r.height,false);this.paperMaterial.uniforms.uSize.value.set(r.width,r.height);this.sky.resize(r.width,r.height);const pixelSize=this.renderer.getDrawingBufferSize(new THREE.Vector2());this.sceneTarget.setSize(pixelSize.x,pixelSize.y);this.finish.resize(r.width,r.height,this.renderer.getPixelRatio());this.background.scale.set(this.width,this.height,1);this.background.material.uniforms.uAspect.value=this.aspect;for(const m of this.materials){m.uniforms.uAspect.value=this.aspect;this.renderer.getDrawingBufferSize(m.uniforms.uResolution.value);}this.schedule();}
 schedule(){if(!this.raf&&this.visible&&!this.lost&&!document.hidden)this.raf=requestAnimationFrame(this.frame);}
 frame(now){this.raf=0;if(!this.visible||this.lost||document.hidden||!this.group)return;const dt=Math.min(.05,(now-(this.last||now))/1000);this.last=now;const paused=stopped(),pending=document.documentElement.classList.contains('intro-pending');if(!pending)this.entryStarted=true;this.time=opticalTime();const scale=1;
  this.pointer.lerp(this.target,.06);this.pressure+=((this.hover&&!paused?1:0)-this.pressure)*.07;
  const rect=this.host.getBoundingClientRect(),viewport=Math.max(1,innerHeight),entry=THREE.MathUtils.clamp(1-rect.top/viewport,0,1),after=THREE.MathUtils.clamp(-rect.top/viewport,0,1);
  const paper=this.footer?THREE.MathUtils.clamp(rect.top/viewport,0,1):THREE.MathUtils.clamp(-rect.top/(.75*viewport),0,1);
  if(this.entryStarted&&!paused)this.entryAge=Math.min(1.2,this.entryAge+dt);
  const dolly=paused?1:24/(24+8*paper+8*(1-entryEase(this.entryAge/1.2)));
  this.camera.position.z=24/dolly;this.group.scale.setScalar(scale*this.worldFit);if(!this.footer)this.group.scale.x*=1.05;this.group.scale.y*=1;
  const targetX=this.footer?THREE.MathUtils.lerp(-Math.PI,0,entry):0,targetY=this.footer?0:THREE.MathUtils.degToRad(THREE.MathUtils.lerp(4,90,after));
  if(paused){this.group.rotation.set(0,this.footer?0:THREE.MathUtils.degToRad(4),0)}else if(this.entryStarted||this.footer){this.group.rotation.x=THREE.MathUtils.damp(this.group.rotation.x,targetX,6,dt);this.group.rotation.y=THREE.MathUtils.damp(this.group.rotation.y,targetY,6,dt)}
  this.group.position.y=this.mobile?(this.footer ? this.height*.025 : this.height*.10):(this.footer ? -.18 : 0);
  // A fixed canvas keeps the sky behind the introduction; only the sculpture follows document anchors.
  this.group.position.y+=(this.footer?(viewport/2-rect.top-rect.height/2):-rect.top*(paused?1:.72))/viewport*this.height/dolly;
  this.group.position.y*=this.worldFit;this.group.position.y+=paused||this.mobile?0:Math.sin(this.time*1.2)*.18+Math.sin(this.time*.6)*.06;
  this.host.dataset.motionPhase=this.footer?'entry':'exit';this.host.dataset.motionProgress=(this.footer?entry:after).toFixed(3);this.host.dataset.rotation=[this.group.rotation.x,this.group.rotation.y].map(v=>THREE.MathUtils.radToDeg(v).toFixed(1)).join(',');
  this.host.dataset.paper=paper.toFixed(3);this.host.dataset.dolly=dolly.toFixed(3);this.paperMaterial.uniforms.uOpacity.value=paper;
  let lightTarget=Math.atan2(9,4);if(this.hover&&!paused){this.lightRay.setFromCamera(new THREE.Vector2(this.pointer.x*2,this.pointer.y*2),this.camera);if(this.lightRay.ray.intersectPlane(this.lightPlane,this.lightHit)&&this.lightHit.lengthSq()>.000001)lightTarget=Math.atan2(-this.lightHit.y,-this.lightHit.x);}
  this.lightAngle+=Math.atan2(Math.sin(lightTarget-this.lightAngle),Math.cos(lightTarget-this.lightAngle))*(1-Math.exp(-6*dt));
  const sceneTime=this.time;this.host.dataset.opticsTime=sceneTime.toFixed(2);for(const m of this.materials){m.uniforms.uTime.value=sceneTime;m.uniforms.uLight.value.set(Math.hypot(4,9)*Math.cos(this.lightAngle),Math.hypot(4,9)*Math.sin(this.lightAngle),.5);}
  this.background.material.uniforms.uTime.value=sceneTime;this.skyPointer.set(.5+this.pointer.x,.5+this.pointer.y);this.sky.render(this.renderer,sceneTime,this.skyPointer);
  // Composite sky and glass in linear space before the single display conversion.
  this.background.visible=true;this.group.visible=true;this.renderer.setRenderTarget(this.sceneTarget);this.renderer.setClearColor(0x000000,1);this.renderer.render(this.scene,this.camera);
  this.renderer.setRenderTarget(null);
  this.renderer.autoClear=false;this.finish.render(this.renderer);this.renderer.render(this.paperScene,this.finishCamera);this.renderer.autoClear=true;if(!paused)this.schedule();
 }
}
const hero=document.getElementById('name-stage');if(hero)new SculptureScene(hero,document.getElementById('name-canvas'));
const footer=document.getElementById('footer-name-stage');if(footer){const lazy=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){lazy.disconnect();new SculptureScene(footer,document.getElementById('footer-name-canvas'),true);}},{rootMargin:'500px'});lazy.observe(footer);}
