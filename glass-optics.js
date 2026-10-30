import * as THREE from './assets/vendor/three.module.js';

// Linear-space transmission and angle-dependent absorption, followed by a
// separate LDR lens pass. Highlights are optical responses, never timed sparkles.
export function createGlassMaterial(top, bottom) {
  return new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: {
      uSkyMap: {value:null}, uTop:{value:new THREE.Color(top)},
      uBottom:{value:new THREE.Color(bottom)}, uTime:{value:0},
      uAspect:{value:1}, uResolution:{value:new THREE.Vector2(1280,720)},
      uLight:{value:new THREE.Vector3(4,9,.5)}, uYRange:{value:new THREE.Vector2(-1,1)}
    },
    vertexShader:`varying vec3 vNormal,vIncident;varying float vHeight;
      void main(){vec4 world=modelMatrix*vec4(position,1.);
        vNormal=normalize((modelMatrix*vec4(normal,0.)).xyz);
        vIncident=normalize(world.xyz-cameraPosition);vHeight=position.y;
        gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:`uniform sampler2D uSkyMap;uniform vec3 uTop,uBottom,uLight;
      uniform vec2 uResolution,uYRange;varying vec3 vNormal,vIncident;varying float vHeight;
      float rand(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      void main(){vec3 n=normalize(vNormal),incident=normalize(vIncident);
        vec2 uv=gl_FragCoord.xy/uResolution;vec3 transmitted=vec3(0.);
        vec3 rayR=refract(incident,n,1./1.15),rayG=refract(incident,n,1./1.18),rayB=refract(incident,n,1./1.22);
        float noise=rand(uv)*.025;
        for(int i=0;i<3;i++){float offset=(.72+float(i)/3.*.1+noise)*.14;
          transmitted+=vec3(texture2D(uSkyMap,uv+rayR.xy*offset).r,
            texture2D(uSkyMap,uv+rayG.xy*offset).g,texture2D(uSkyMap,uv+rayB.xy*offset).b);}
        transmitted/=3.;float luma=dot(transmitted,vec3(.2125,.7154,.0721));
        transmitted=mix(vec3(luma),transmitted,1.2);transmitted=(transmitted*.78-.5)*.9+.5;
        float height=clamp((vHeight-uYRange.x)/max(uYRange.y-uYRange.x,.00001),0.,1.);
        vec3 absorption=clamp(mix(uBottom,uTop,height),.001,1.);
        float edge=1.-abs(dot(n,incident));float tintAlpha=mix(.92,1.,edge);
        vec3 color=mix(transmitted,transmitted*absorption,tintAlpha);
        vec3 light=normalize(-uLight),halfway=normalize(incident+light);
        float specular=pow(abs(dot(n,halfway)),120.);
        color+=(specular+max(0.,dot(n,light))*.1)*1.2;
        color+=edge*smoothstep(-.5,.5,dot(n,normalize(vec3(-1,1,-1))))*.24;
        gl_FragColor=vec4(color,1.);
        #include <colorspace_fragment>
      }`
  });
}

const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export class GlassFinish {
  constructor(texture){
    this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,stencilBuffer:false,type:THREE.UnsignedByteType});
    this.flare=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,
      uniforms:{uImage:{value:texture},uSize:{value:new THREE.Vector2(1,1)},uStride:{value:1},uTail:{value:new THREE.Color('#ffa300')}},
      vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D uImage;
        uniform vec2 uSize;uniform float uStride;uniform vec3 uTail;
        float brightMask(float lum){float m=clamp((lum-.99)/.01,0.,1.);m=m*m*(3.-2.*m);m=pow(m,32.);return m*clamp((m-.88)/.12,0.,1.);}
        vec3 bright(vec2 p){vec4 c=texture2D(uImage,p);return c.rgb*c.a*brightMask(dot(c.rgb,vec3(.2126,.7152,.0722)));}
        vec3 streak(vec2 dir){vec3 sum=vec3(0.);vec2 p=floor(vUv*uSize);
          float phase=step(.5,fract(52.9829189*fract(dot(p,vec2(.06711056,.00583715)))))*.5;
          for(int i=1;i<=8;i++){float d=float(i)*1.5+phase,w=1./(1.+d*.22);
            vec3 tint=mix(vec3(1.),uTail,sqrt(clamp(d/8.,0.,1.)));
            sum+=(bright(vUv+dir*d)+bright(vUv-dir*d))*w*w*tint;}return sum;}
        void main(){vec2 px=uStride/uSize;
          vec3 glow=bright(vUv)*1.2+streak(vec2(0.,px.y))+
            streak(vec2(px.x*.8660254,px.y*.5))+streak(vec2(px.x*.8660254,-px.y*.5));
          gl_FragColor=vec4(glow*.525,1.);}`});
    this.composite=new THREE.ShaderMaterial({transparent:false,depthTest:false,depthWrite:false,toneMapped:false,
      uniforms:{uImage:{value:texture},uFlare:{value:this.target.texture}},vertexShader:vertex,
      fragmentShader:`varying vec2 vUv;uniform sampler2D uImage,uFlare;
        void main(){vec4 base=texture2D(uImage,vUv);vec3 flare=texture2D(uFlare,vUv).rgb;
          gl_FragColor=vec4(base.rgb+flare,1.);
          #include <colorspace_fragment>
        }`});
    this.scene=new THREE.Scene();this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.flare);this.scene.add(this.quad);
  }
  resize(width,height,dpr){
    const w=Math.max(1,Math.floor(width*dpr*.5)),h=Math.max(1,Math.floor(height*dpr*.5));
    this.target.setSize(w,h);this.flare.uniforms.uSize.value.set(width*dpr,height*dpr);
    this.flare.uniforms.uStride.value=8*width/1920*(width<600?2:1);
  }
  render(renderer){
    this.quad.material=this.flare;renderer.setRenderTarget(this.target);renderer.render(this.scene,this.camera);
    this.quad.material=this.composite;renderer.setRenderTarget(null);renderer.render(this.scene,this.camera);
  }
}
