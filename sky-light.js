import * as THREE from './assets/vendor/three.module.js';
// Low-resolution optical passes: shaped light, local swirl, wave refraction,
// cell displacement, lens blur, and blue/cream output. No image assets are used.
const vertex=`varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}`;
const header=`varying vec2 vUv;uniform sampler2D source;uniform vec2 size,pointer;uniform float time;uniform vec3 cream,blue,green;
 mat2 turn(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
 vec2 hash(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
`;
const passes=[
 `void main(){vec2 p=(vUv-pointer)*vec2(size.x/size.y*.54,.46);float edge=smoothstep(.0885,.2655,length(p));edge=mix(edge,1.,.16);gl_FragColor=vec4(mix(cream,blue,edge),1.);}`,
 `void main(){vec2 p=vUv-pointer;vec2 q=p*vec2(size.x/size.y,1.);float d=length(q);vec2 sampleUv=p;
 if(d<.25){float angle=atan(q.y,q.x)+(1.-smoothstep(0.,.25,d))+time/20.;sampleUv=vec2(cos(angle),sin(angle))*d+pointer;}
 vec2 warped=mix(sampleUv,vUv,smoothstep(0.,.25,d));gl_FragColor=texture2D(source,mix(vUv,warped,.5));}`,
 `void main(){vec2 p=vUv*2.-1.;p.x+=sin((p.y+pointer.y)*7.+time*.25)*.236;gl_FragColor=texture2D(source,p*.5+.5);}`,
 `void main(){vec2 p=(vUv-.5)*vec2(size.x/size.y,1.)*16.;p=p*turn(-.78539816339)*vec2(1.,.1);vec2 cell=floor(p),local=fract(p);float first=15.,second=15.;vec2 nearest=vec2(0.);
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 n=vec2(float(x),float(y));vec2 point=.5+.5*sin(5.+time*.2+6.2831*hash(cell+n));float d=length(n+point-local);if(d<first){second=first;first=d;nearest=point;}else second=min(second,d);}
 vec2 offset=(nearest*.36-.18)*smoothstep(0.,.02,first)*smoothstep(0.,.04,second-first);gl_FragColor=texture2D(source,vUv+offset);}`,
 `void main(){vec3 total=vec3(0.),weights=vec3(0.);float radius=1.;vec2 pixel=vec2(size.y/size.x,1.)*.003*1.178125;
 for(int i=0;i<32;i++){float a=float(i)*2.39996323;radius+=1./radius;vec2 offset=(radius-1.)*vec2(cos(a),sin(a))*pixel;offset*=1.+.05*(sin(a*.1)*.5+.5)*sin(a*.7);vec3 c=texture2D(source,vUv+offset).rgb;vec3 weight=vec3(5.)+pow(c,vec3(9.))*150.;total+=c*weight;weights+=weight;}
 gl_FragColor=vec4(total/weights,1.);}`,
 `void main(){vec3 base=mix(cream,vec3(1.),.61),light=clamp(texture2D(source,vUv).rgb+green*.35,0.,1.);gl_FragColor=vec4(base*mix(vec3(1.),light,.65),1.);}`
];
export class SkyLight {
 constructor(){
  this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  this.uniforms={source:{value:null},size:{value:new THREE.Vector2(1,1)},pointer:{value:new THREE.Vector2(.5,.5)},time:{value:0},cream:{value:new THREE.Color('#ffead6')},blue:{value:new THREE.Color('#6196ff')},green:{value:new THREE.Color('#acffb9')}};
  this.materials=passes.map(fragment=>new THREE.ShaderMaterial({uniforms:this.uniforms,vertexShader:vertex,fragmentShader:header+fragment,depthTest:false,depthWrite:false,toneMapped:false,blending:THREE.NoBlending}));
  this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.materials[0]);this.scene.add(this.quad);
  this.targets=[0,1].map(()=>new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,stencilBuffer:false}));this.texture=this.targets[1].texture;this.last=-100;
 }
 resize(w,h){w=Math.max(1,Math.round(w*.3));h=Math.max(1,Math.round(h*.3));this.targets.forEach(t=>t.setSize(w,h));this.uniforms.size.value.set(w,h);this.last=-100}
 render(renderer,time,pointer){
  if(time-this.last<1/30&&this.uniforms.pointer.value.distanceTo(pointer)<.001)return;
  this.last=time;this.uniforms.time.value=time;this.uniforms.pointer.value.copy(pointer);
  for(let i=0;i<this.materials.length;i++){this.quad.material=this.materials[i];this.uniforms.source.value=this.targets[(i+1)%2].texture;renderer.setRenderTarget(this.targets[i%2]);renderer.render(this.scene,this.camera)}
  renderer.setRenderTarget(null);
 }
 dispose(){this.materials.forEach(m=>m.dispose());this.targets.forEach(t=>t.dispose());this.quad.geometry.dispose()}
}
