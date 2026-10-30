import * as THREE from './assets/vendor/three.module.js';
import Lenis from './assets/vendor/lenis.mjs';

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const paused=()=>reduced.matches||document.body.classList.contains('is-paused');
const blocked=()=>document.documentElement.classList.contains('intro-pending')||document.body.classList.contains('detail-open');
const lenis=new Lenis({lerp:.1,smoothWheel:true,syncTouch:true,prevent:el=>Boolean(el.closest?.('dialog,[data-lenis-prevent]'))});
let frameId=0,last=0,lastScroll=scrollY,curl=0;
const syncControls=()=>{if(blocked())lenis.stop();else lenis.start()};
new MutationObserver(syncControls).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
new MutationObserver(syncControls).observe(document.body,{attributes:true,attributeFilter:['class']});
syncControls();
// Native scrolling remains available when motion is paused or reduced.
lenis.options.virtualScroll=()=>!paused();

const canvas=document.createElement('canvas');canvas.className='scroll-image-layer';canvas.setAttribute('aria-hidden','true');
document.querySelector('.portfolio-page').appendChild(canvas);
let renderer,scene,camera;const layers=[];
try{
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.setClearColor(0,0);scene=new THREE.Scene();camera=new THREE.Camera();
 const geometry=new THREE.PlaneGeometry(2,2),loader=new THREE.TextureLoader();
 for(const img of document.querySelectorAll('.case-cover>img,.tool-showcase>img')){
  const layer={img,progress:0,mesh:null,ready:false};layers.push(layer);
  loader.load(img.currentSrc||img.src,texture=>{
   texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;
   const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,toneMapped:false,
    uniforms:{uImage:{value:texture},uRect:{value:new THREE.Vector4()},uCurl:{value:0},uPolarity:{value:1},uImageAspect:{value:texture.image.width/texture.image.height},uBoxAspect:{value:1}},
    vertexShader:'varying vec2 screenUv;void main(){screenUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`varying vec2 screenUv;uniform sampler2D uImage;uniform vec4 uRect;uniform float uCurl,uPolarity,uImageAspect,uBoxAspect;
     void main(){
      float y=screenUv.y*2.-1.;float profile=1.-sqrt(max(0.,1.-y*y));
      vec2 distorted=vec2((screenUv.x-.5)*(1.-profile*uCurl)+.5,screenUv.y);
      vec2 local=(distorted-uRect.xy)/uRect.zw,edge=min(local,1.-local);
      vec2 aa=max(fwidth(local),vec2(.00001));float alpha=smoothstep(0.,aa.x,edge.x)*smoothstep(0.,aa.y,edge.y);
      if(alpha<.001)discard;
      vec2 sampleUv=local;if(uImageAspect>uBoxAspect)sampleUv.x=(local.x-.5)*uBoxAspect/uImageAspect+.5;else sampleUv.y=(local.y-.5)*uImageAspect/uBoxAspect+.5;
      vec3 color=texture2D(uImage,clamp(sampleUv,0.,1.)).rgb;color=mix(1.-color,color,uPolarity);
      gl_FragColor=vec4(color,alpha);
      #include <colorspace_fragment>
     }`});
   layer.mesh=new THREE.Mesh(geometry,material);layer.mesh.frustumCulled=false;layer.mesh.visible=false;scene.add(layer.mesh);layer.ready=true;
  },undefined,()=>{layer.ready=false});
 }
 const resize=()=>renderer?.setSize(innerWidth,innerHeight,false);addEventListener('resize',resize);resize();
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();layers.forEach(l=>l.img.classList.remove('scroll-image-ready'));renderer=null;canvas.style.display='none'});
}catch(error){canvas.remove();console.warn('Native project images retained:',error.message)}

const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function frame(now){
 const dt=Math.min(.1,(now-(last||now))/1000);last=now;lenis.raf(now);
 const y=scrollY,speed=Math.abs(y-lastScroll)/Math.max(1/240,dt);lastScroll=y;
 const target=paused()||blocked()?0:Math.min(1,speed/800),tau=target>curl?.025:.175;
 curl+=(target-curl)*(1-Math.exp(-dt/tau));
 if(renderer){
  let hasVisible=false;
  for(const layer of layers){
   if(!layer.ready)continue;
   const r=layer.img.getBoundingClientRect(),style=getComputedStyle(layer.img),px=parseFloat(style.paddingLeft)||0,py=parseFloat(style.paddingTop)||0;
   const left=r.left+px,top=r.top+py,width=r.width-2*px,height=r.height-2*py;
   const visible=!document.body.classList.contains('detail-open')&&top+height>0&&top<innerHeight&&width>0;
   layer.mesh.visible=visible;
   if(!visible){layer.progress=0;continue}
   layer.progress=paused()?1:Math.min(1,layer.progress+dt/.8);
   const u=layer.mesh.material.uniforms;u.uRect.value.set(left/innerWidth,1-(top+height)/innerHeight,width/innerWidth,height/innerHeight);u.uCurl.value=paused()?0:.06*curl;u.uPolarity.value=ease(layer.progress);u.uBoxAspect.value=width/height;
   hasVisible=true;
  }
  renderer.render(scene,camera);
  // Replace an image only after its texture has been drawn; failed textures keep their native image.
  for(const layer of layers)if(layer.ready&&layer.mesh.visible)layer.img.classList.add('scroll-image-ready');
  canvas.dataset.curl=(.06*curl).toFixed(4);canvas.dataset.active=String(hasVisible);
 }
 frameId=requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frameId);frameId=0}else if(!frameId){last=0;frameId=requestAnimationFrame(frame)}});
addEventListener('pagehide',()=>{cancelAnimationFrame(frameId);frameId=0});
addEventListener('pageshow',()=>{if(!frameId){last=0;frameId=requestAnimationFrame(frame)}});
frameId=requestAnimationFrame(frame);
