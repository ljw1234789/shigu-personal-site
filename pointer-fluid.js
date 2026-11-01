import * as THREE from './assets/vendor/three.module.js';
// Incompressible pointer flow: splat, divergence, four pressure solves,
// projection and advection. The optical displacement expires after 600 ms idle.
const vertex='varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}';
const head='varying vec2 vUv;uniform sampler2D velocity,pressure,divergence;uniform vec2 texel,resolution,pointer,delta;';
export class PointerFluid{
 constructor(){
  this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);this.scene=new THREE.Scene();this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));this.scene.add(this.quad);
  this.u={velocity:{value:null},pressure:{value:null},divergence:{value:null},texel:{value:new THREE.Vector2()},resolution:{value:new THREE.Vector2()},pointer:{value:new THREE.Vector2(-1,-1)},delta:{value:new THREE.Vector2()},image:{value:null},simSize:{value:new THREE.Vector2()},enabled:{value:0}};
  const mat=fragment=>new THREE.ShaderMaterial({uniforms:this.u,vertexShader:vertex,fragmentShader:head+fragment,depthTest:false,depthWrite:false,toneMapped:false});
  this.splat=mat(`void main(){vec2 v=clamp(texture2D(velocity,vUv).xy,-1000.,1000.);vec2 d=vUv-pointer/resolution;d.x*=resolution.x/resolution.y;v+=delta/resolution*exp(-dot(d,d)/.003)*3000.;gl_FragColor=vec4(v,0.,1.);}`);
  this.div=mat(`void main(){float l=texture2D(velocity,vUv-vec2(texel.x,0.)).x,r=texture2D(velocity,vUv+vec2(texel.x,0.)).x,t=texture2D(velocity,vUv+vec2(0.,texel.y)).y,b=texture2D(velocity,vUv-vec2(0.,texel.y)).y;gl_FragColor=vec4(.5*(r-l+t-b),0.,0.,1.);}`);
  this.clear=mat('void main(){gl_FragColor=vec4(0.);}');
  this.solve=mat(`void main(){float l=texture2D(pressure,vUv-vec2(texel.x,0.)).x,r=texture2D(pressure,vUv+vec2(texel.x,0.)).x,t=texture2D(pressure,vUv+vec2(0.,texel.y)).x,b=texture2D(pressure,vUv-vec2(0.,texel.y)).x;gl_FragColor=vec4((l+r+t+b-texture2D(divergence,vUv).x)*.25,0.,0.,1.);}`);
  this.project=mat(`void main(){float l=texture2D(pressure,vUv-vec2(texel.x,0.)).x,r=texture2D(pressure,vUv+vec2(texel.x,0.)).x,t=texture2D(pressure,vUv+vec2(0.,texel.y)).x,b=texture2D(pressure,vUv-vec2(0.,texel.y)).x;gl_FragColor=vec4(texture2D(velocity,vUv).xy-vec2(r-l,t-b),0.,1.);}`);
  this.advect=mat(`void main(){vec2 v=texture2D(velocity,vUv).xy;vec2 uv=clamp(vUv-v*texel*.016,0.,1.);gl_FragColor=vec4(texture2D(velocity,uv).xy/(1.+3.*.016),0.,1.);}`);
  this.display=mat(`uniform sampler2D image;uniform vec2 simSize;uniform float enabled;void main(){vec2 d=texture2D(velocity,vUv).xy/simSize*enabled;float speed=length(d);vec3 sum=vec3(0.),weights=vec3(0.);for(int i=0;i<4;i++){float t=float(i)/3.;vec3 w=max(vec3(0.),cos((t-vec3(0.,.5,1.))*3.14159*.5));sum+=texture2D(image,clamp(vUv-d*.3*(t+.3)*speed,0.,1.)).rgb*w;weights+=w;}vec3 spectrum=cos((sin(speed*2.)*.4+.6-vec3(0.,.5,1.))*vec3(.6,1.,.5)*3.14);gl_FragColor=vec4(sum/max(weights,vec3(.0001))+spectrum*smoothstep(.2,.8,speed)*.25*enabled,1.);
  #include <colorspace_fragment>
  }`);
  this.targets=Array.from({length:7},()=>new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,stencilBuffer:false,type:THREE.HalfFloatType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter}));
  this.current=new THREE.Vector2(-1,-1);this.previous=new THREE.Vector2(-1,-1);this.lastMove=-Infinity;this.active=false;this.needsClear=true;
 }
 resize(w,h,dpr){this.dpr=dpr;this.mobile=w<600;this.u.resolution.value.set(w*dpr,h*dpr);const aspect=w/h,sw=aspect>1?Math.round(160*aspect):160,sh=aspect>1?160:Math.round(160/aspect);this.targets.forEach(t=>t.setSize(sw,sh));this.u.texel.value.set(1/sw,1/sh);this.u.simSize.value.set(sw,sh);this.needsClear=true;}
 move(x,y){this.current.set(x*this.dpr,(this.u.resolution.value.y/this.dpr-y)*this.dpr);}
 pass(renderer,material,target){this.quad.material=material;renderer.setRenderTarget(target);renderer.render(this.scene,this.camera);}
 render(renderer,image,allowed){
  if(this.needsClear){for(const t of this.targets)this.pass(renderer,this.clear,t);this.needsClear=false;}
  const u=this.u;u.delta.value.set(0,0);if(this.current.x>=0){if(this.previous.x>=0)u.delta.value.subVectors(this.current,this.previous);this.previous.copy(this.current);u.pointer.value.copy(this.current);}
  if(allowed&&u.delta.value.lengthSq()>1)this.lastMove=performance.now();this.active=allowed&&!this.mobile&&performance.now()-this.lastMove<600;
  let [read,write,splat,div,pa,pb,projected]=this.targets;
  if(this.active){u.velocity.value=read.texture;this.pass(renderer,this.splat,splat);u.velocity.value=splat.texture;this.pass(renderer,this.div,div);this.pass(renderer,this.clear,pa);u.divergence.value=div.texture;for(let n=0;n<4;n++){u.pressure.value=pa.texture;this.pass(renderer,this.solve,pb);[pa,pb]=[pb,pa];}u.pressure.value=pa.texture;this.pass(renderer,this.project,projected);u.velocity.value=projected.texture;this.pass(renderer,this.advect,write);this.targets[0]=write;this.targets[1]=read;read=write;}
  u.image.value=image;u.velocity.value=read.texture;u.enabled.value=this.active?1:0;this.pass(renderer,this.display,null);
 }
}
