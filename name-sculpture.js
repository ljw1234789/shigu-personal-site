import * as THREE from './assets/vendor/three.module.js';
import {SkyLight} from './sky-light.js?v=reference-20261030-4';
// Original inflated meshes and procedural light; no model or artwork from the reference site.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const stopped=()=>reduced.matches||document.body.classList.contains('is-paused')||document.body.classList.contains('detail-open');
const geometries=new Map();
function loadGeometry(key){
 if(!geometries.has(key))geometries.set(key,(async()=>{
  const response=await fetch(new URL(`./assets/sculpture-v2/${key}.bin?v=refined-20261030-2`,import.meta.url));if(!response.ok)throw new Error('Lettering asset unavailable');
  const buffer=await response.arrayBuffer(),[n,count,scale,indexBytes]=new Uint32Array(buffer,0,4),packed=new Int16Array(buffer,16,n*3),pos=new Float32Array(n*3);
  for(let i=0;i<pos.length;i++)pos[i]=packed[i]/scale;
  const offset=16+Math.ceil(packed.byteLength/4)*4,index=indexBytes===2?new Uint16Array(buffer,offset,count):new Uint32Array(buffer,offset,count);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));geometry.setIndex(new THREE.BufferAttribute(index,1));geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
 })());return geometries.get(key);
}
// Shared procedural backdrop, sampled by the lettering too so the image bends through the surface.
const skyFunctions=`uniform sampler2D uSkyMap;vec3 skyAt(vec2 uv){return texture2D(uSkyMap,clamp(uv,0.,1.)).rgb;}`;
const cloudVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const cloudFragment=`varying vec2 vUv;${skyFunctions}void main(){gl_FragColor=vec4(skyAt(vUv),1.);#include <colorspace_fragment>}`.replace('#include','\n#include');
function skyUniforms(){return {uSkyMap:{value:null},uTime:{value:0},uAspect:{value:1}};}
function letteringMaterial(top,bottom){
 const uniforms={...skyUniforms(),uTop:{value:new THREE.Color(top)},uBottom:{value:new THREE.Color(bottom)},uResolution:{value:new THREE.Vector2(1280,720)},uLight:{value:new THREE.Vector3(4,9,.5)},uYRange:{value:new THREE.Vector2(-1,1)}};
 const material=new THREE.ShaderMaterial({uniforms,toneMapped:false,
 vertexShader:`varying vec3 vNormal,vEye;varying float vHeight;void main(){vec4 view=viewMatrix*modelMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vEye=-view.xyz;vHeight=position.y;gl_Position=projectionMatrix*view;}`,
 fragmentShader:`${skyFunctions}
 uniform vec3 uTop,uBottom,uLight;uniform vec2 uResolution,uYRange;varying vec3 vNormal,vEye;varying float vHeight;
 void main(){
  vec3 n=normalize(vNormal),eye=normalize(vEye);vec2 uv=gl_FragCoord.xy/uResolution;
  vec3 incident=-eye,colorSum=vec3(0.);
  for(int i=0;i<3;i++){float offset=(.72+float(i)/30.)*.14;
   colorSum+=vec3(skyAt(uv+refract(incident,n,1./1.15).xy*offset).r,skyAt(uv+refract(incident,n,1./1.18).xy*offset).g,skyAt(uv+refract(incident,n,1./1.22).xy*offset).b);}
  vec3 color=colorSum/3.;float luminance=dot(color,vec3(.2125,.7154,.0721));color=mix(vec3(luminance),color,1.2);color=(color*.78-.5)*.9+.5;
  float height=clamp((vHeight-uYRange.x)/(uYRange.y-uYRange.x),0.,1.);vec3 tint=mix(uBottom,uTop,height);
  float edge=1.-abs(dot(n,eye));color*=mix(vec3(1.),max(tint,vec3(.001)),mix(.92,1.,edge));
  vec3 light=normalize(-uLight),halfway=normalize(incident+light);float spec=pow(abs(dot(n,halfway)),120.);
  color+=(spec+max(0.,dot(n,light))*.1)*1.2;
  float side=smoothstep(-.5,.5,dot(n,normalize(vec3(-1,1,-1))));color+=edge*side*.24;
  gl_FragColor=vec4(color,1.);
  #include <colorspace_fragment>
 }`});return material;
}
class SculptureScene{
 constructor(host,canvas,footer=false){this.host=host;this.canvas=canvas;this.footer=footer;this.visible=false;this.lost=false;this.raf=0;this.time=0;this.entry=0;this.last=0;this.pointer=new THREE.Vector2(0,0);this.target=new THREE.Vector2(0,0);this.hover=false;this.pressure=0;this.frame=this.frame.bind(this);this.schedule=this.schedule.bind(this);this.init();}
 async init(){try{
  this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:false,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.06;
  this.letterTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:true});
  this.finishScene=new THREE.Scene();this.finishCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  this.finishMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,toneMapped:false,uniforms:{uImage:{value:this.letterTarget.texture},uTexel:{value:new THREE.Vector2(1,1)}},vertexShader:`varying vec2 uvScreen;void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`varying vec2 uvScreen;uniform sampler2D uImage;uniform vec2 uTexel;
  vec3 bright(vec2 p){vec4 c=texture2D(uImage,p);float l=max(c.r,max(c.g,c.b));return c.rgb*c.a*smoothstep(.92,1.35,l);}
  void main(){vec4 base=texture2D(uImage,uvScreen);vec3 glow=vec3(0.);
    for(int i=1;i<=5;i++){float d=float(i)*2.4,w=pow(1.-float(i)/6.,2.);glow+=w*(bright(uvScreen+vec2(d,0.)*uTexel)+bright(uvScreen-vec2(d,0.)*uTexel)+bright(uvScreen+vec2(0.,d)*uTexel)+bright(uvScreen-vec2(0.,d)*uTexel));}
    glow*=.035;float a=max(base.a,clamp(max(glow.r,max(glow.g,glow.b)),0.,.75));if(a<.001)discard;gl_FragColor=vec4((base.rgb*base.a+glow)/a,a);
    #include <colorspace_fragment>
  }`});this.finishScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.finishMaterial));
  this.sky=new SkyLight();this.skyPointer=new THREE.Vector2(.5,.5);
  this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-5,5,3,-3,.1,30);this.camera.position.set(0,0,10);
  this.background=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({vertexShader:cloudVertex,fragmentShader:cloudFragment,uniforms:skyUniforms(),depthWrite:false,depthTest:false,toneMapped:false}));this.background.position.z=-5;this.background.renderOrder=-10;this.scene.add(this.background);
  this.scene.add(new THREE.HemisphereLight('#e8f2ff','#e2d4bd',.45));const key=new THREE.DirectionalLight('#fffaf0',1.6);key.position.set(-4,4,6);this.scene.add(key);const fill=new THREE.DirectionalLight('#c8dfff',.8);fill.position.set(5,1,2);this.scene.add(fill);
  this.group=new THREE.Group();this.scene.add(this.group);this.materials=[];
  if(this.footer){
   const specs=[['craft',1.12,-.04,'#ffffff','#9dceeb'],['and',0,.06,'#009dff','#ffffff'],['taste',-1.12,.02,'#38afff','#009dff']];
   const models=await Promise.all(specs.map(s=>loadGeometry(s[0])));specs.forEach(([key,y,z,top,bottom],i)=>{const m=letteringMaterial(top,bottom);models[i].computeBoundingBox();m.uniforms.uYRange.value.set(models[i].boundingBox.min.y,models[i].boundingBox.max.y);this.materials.push(m);const mesh=new THREE.Mesh(models[i],m);mesh.position.y=y;mesh.rotation.z=z;mesh.scale.y=.85;mesh.position.z=i===1?.25:0;this.group.add(mesh);});
  }else{const m=letteringMaterial('#009dff','#ffffff');const geometry=await loadGeometry('name');geometry.computeBoundingBox();m.uniforms.uYRange.value.set(geometry.boundingBox.min.y,geometry.boundingBox.max.y);this.materials.push(m);this.group.add(new THREE.Mesh(geometry,m));}
  this.background.material.uniforms.uSkyMap.value=this.sky.texture;this.materials.forEach(m=>m.uniforms.uSkyMap.value=this.sky.texture);this.visible=true;this.resize();this.frame(performance.now());this.host.classList.add('ready');this.host.dataset.renderState='ready';
  new ResizeObserver(()=>this.resize()).observe(this.host);
  new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible){this.last=0;this.schedule();}else{cancelAnimationFrame(this.raf);this.raf=0;}},{rootMargin:'50px'}).observe(this.host);
  const target=this.host.parentElement;target.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||stopped())return;const r=this.host.getBoundingClientRect();this.target.set((e.clientX-r.left)/r.width-.5,.5-(e.clientY-r.top)/r.height);this.hover=true;this.schedule();},{passive:true});target.addEventListener('pointerleave',()=>{this.target.set(0,0);this.hover=false;});
  new MutationObserver(()=>{if(stopped()){this.target.set(0,0);this.hover=false;}this.schedule();}).observe(document.body,{attributes:true,attributeFilter:['class']});new MutationObserver(this.schedule).observe(document.documentElement,{attributes:true,attributeFilter:['class']});reduced.addEventListener('change',this.schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(this.raf);this.raf=0;}else{this.last=0;this.schedule();}});
  this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;cancelAnimationFrame(this.raf);this.raf=0;this.host.classList.remove('ready');this.host.dataset.renderState='fallback';});this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.host.classList.add('ready');this.host.dataset.renderState='ready';this.schedule();});
  addEventListener('pagehide',()=>{cancelAnimationFrame(this.raf);this.raf=0;});addEventListener('pageshow',()=>{this.last=0;this.schedule();});
 }catch(error){this.host.classList.remove('ready');this.host.dataset.renderState='fallback';this.sky?.dispose();this.renderer?.dispose();console.warn('Readable lettering fallback:',error.message);}}
 resize(){if(!this.camera||this.lost)return;const r=this.host.getBoundingClientRect();if(!r.width||!r.height)return;this.aspect=r.width/r.height;this.height=Math.max(this.footer?6.2:6.,(this.footer?5.6:7.3)/this.aspect);this.width=this.height*this.aspect;this.mobile=r.width<600;Object.assign(this.camera,{left:-this.width/2,right:this.width/2,top:this.height/2,bottom:-this.height/2});this.camera.updateProjectionMatrix();this.renderer.setSize(r.width,r.height,false);this.sky.resize(r.width,r.height);const pixelSize=this.renderer.getDrawingBufferSize(new THREE.Vector2());this.letterTarget.setSize(pixelSize.x,pixelSize.y);this.finishMaterial.uniforms.uTexel.value.set(1/pixelSize.x,1/pixelSize.y);this.background.scale.set(this.width,this.height,1);this.background.material.uniforms.uAspect.value=this.aspect;for(const m of this.materials){m.uniforms.uAspect.value=this.aspect;this.renderer.getDrawingBufferSize(m.uniforms.uResolution.value);}this.schedule();}
 schedule(){if(!this.raf&&this.visible&&!this.lost&&!document.hidden)this.raf=requestAnimationFrame(this.frame);}
 frame(now){this.raf=0;if(!this.visible||this.lost||document.hidden||!this.group)return;const dt=Math.min(.05,(now-(this.last||now))/1000);this.last=now;const paused=stopped(),pending=document.documentElement.classList.contains('intro-pending');if(!paused)this.time+=dt;if(!pending)this.entry=paused?2:Math.min(2,this.entry+dt);const scale=1;
  this.pointer.lerp(this.target,.06);this.pressure+=((this.hover&&!paused?1:0)-this.pressure)*.07;
  this.group.scale.setScalar(scale);if(!this.footer)this.group.scale.x*=1.05;this.group.scale.y*=this.footer||this.mobile ? 1 : .85;
  this.group.rotation.set(-.03,(this.footer?-.09:.07)+(paused?0:this.pointer.x*.025),this.footer?-.015:0);
  this.group.position.y=this.mobile?(this.footer ? this.height*.025 : this.height*.10):(this.footer ? -.18 : .70);this.group.position.y+=paused?0:Math.sin(this.time*1.2)*.18+Math.sin(this.time*.6)*.06;
  const sceneTime=this.time+(this.footer?27:0);for(const m of this.materials){m.uniforms.uTime.value=sceneTime;m.uniforms.uLight.value.set(4+this.pointer.x*7,9+this.pointer.y*5,.5);}
  this.background.material.uniforms.uTime.value=sceneTime;this.skyPointer.set(.5+this.pointer.x,.5+this.pointer.y);this.sky.render(this.renderer,sceneTime,this.skyPointer);
  this.background.visible=false;this.renderer.setRenderTarget(this.letterTarget);this.renderer.setClearColor(0x000000,0);this.renderer.render(this.scene,this.camera);
  this.renderer.setRenderTarget(null);this.background.visible=true;this.group.visible=false;this.renderer.render(this.scene,this.camera);this.group.visible=true;
  this.renderer.autoClear=false;this.renderer.render(this.finishScene,this.finishCamera);this.renderer.autoClear=true;if(!paused)this.schedule();
 }
}
const hero=document.getElementById('name-stage');if(hero)new SculptureScene(hero,document.getElementById('name-canvas'));
const footer=document.getElementById('footer-name-stage');if(footer){const lazy=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){lazy.disconnect();new SculptureScene(footer,document.getElementById('footer-name-canvas'),true);}},{rootMargin:'500px'});lazy.observe(footer);}
