import * as THREE from './assets/vendor/three.module.js';

const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = () => innerWidth < 700;
const tools = window.CREATIVE_TOOLS;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e8dcc5');
scene.fog = new THREE.Fog('#e8dcc5', 110, 190);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile()?1.5:1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.03;
$('world').appendChild(renderer.domElement);
const camera = new THREE.OrthographicCamera(-50,50,30,-30,.1,250);
const cameraTarget = new THREE.Vector3(0,0,0);
let cameraAngle=.30, cameraHeight=mobile()?42:59, cameraViewHeight=cameraHeight, overview=true, driving=false;
scene.add(new THREE.HemisphereLight('#fff7e4','#889b7b',1.65));
const sunlight = new THREE.DirectionalLight('#fff0cf',3.1);
sunlight.position.set(-35,60,25); sunlight.castShadow=true;
sunlight.shadow.mapSize.set(2048,2048);
Object.assign(sunlight.shadow.camera,{left:-65,right:65,top:55,bottom:-55,near:1,far:140});
sunlight.shadow.bias=-.0003; sunlight.shadow.normalBias=.08; sunlight.shadow.radius=3;
scene.add(sunlight); scene.add(sunlight.target);
const palette={cream:'#eee5d0',white:'#fff8e8',sand:'#cfb995',path:'#b4b194',green:'#395b46',leaf:'#73905a',mint:'#c8d9b1',dark:'#293e36',orange:'#ce7744',yellow:'#ebc36b',blue:'#8caeae',pink:'#b88479',purple:'#aaa1bd',wood:'#94744f',tire:'#30362d',glass:'#527b78'};
const materials=new Map();
function mat(color, options={}) { const key=color+JSON.stringify(options); if(!materials.has(key)) materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.86,metalness:0,...options})); return materials.get(key); }
function mesh(geometry, color, x=0,y=0,z=0,parent=scene,options={}) { const item=new THREE.Mesh(geometry,typeof color==='string'?mat(color,options):color);item.position.set(x,y,z);item.castShadow=true;item.receiveShadow=true;parent.add(item);return item; }
function box(w,h,d,color,x=0,y=0,z=0,parent=scene) { return mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent); }
function cylinder(rt,rb,h,color,x=0,y=0,z=0,parent=scene,n=16) { return mesh(new THREE.CylinderGeometry(rt,rb,h,n),color,x,y,z,parent); }
function roundShape(w,h,r) { const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s; }
function bevelBox(w,h,d,color,x=0,y=0,z=0,parent=scene,r=.12) { const geo=new THREE.ExtrudeGeometry(roundShape(w-.1,h-.1,r),{depth:d-.1,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:1,steps:1,curveSegments:3});geo.translate(0,0,-(d-.1)/2);return mesh(geo,color,x,y,z,parent); }
function slab(w,d,h,color,x,z,y=0,r=.6) { const geo=new THREE.ExtrudeGeometry(roundShape(w,d,r),{depth:h,bevelEnabled:true,bevelThickness:.12,bevelSize:.12,bevelSegments:2,curveSegments:5});geo.rotateX(-Math.PI/2);return mesh(geo,color,x,y-h,z); }
function line(points,color,width=.07,parent=scene) { const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(new THREE.TubeGeometry(curve,20,width,5,false),color,0,0,0,parent); }
function ring(radius,color,x,y,z,parent=scene,tube=.06) { const m=mesh(new THREE.TorusGeometry(radius,tube,6,48),color,x,y,z,parent);return m; }
let randomSeed=77; function rand(){randomSeed=(randomSeed*16807)%2147483647;return(randomSeed-1)/2147483646;}
const decorations=[], colliders=[], nodeMeshes=[], wheels=[], floating=[];

// A self-contained architectural diorama. All geometry is authored for this site.
slab(85,59,2.2,'#c5ad87',0,0,-.12,7);
slab(84.7,58.7,.24,'#d7c9aa',0,0,0,7);
const seabed=mesh(new THREE.PlaneGeometry(600,600), '#d9ccb3',0,-3,0);seabed.rotation.x=-Math.PI/2;seabed.castShadow=false;
// A small pond with a timber footbridge.
const pond=slab(15,10,.1,'#80a8a2',-29,-23,.08,4);
for(let i=0;i<4;i++){const ripple=ring(1.2+i*.65,'#b9cfbc',-29,.17,-23);ripple.rotation.x=-Math.PI/2;ripple.scale.y=.6;decorations.push({type:'ripple',mesh:ripple,phase:i});}
for(let i=0;i<11;i++)box(5,.15,.6,palette.wood,-29,.46,-26+i*.65);
for(const x of [-31.3,-26.7]){for(const z of [-26,-22.5,-19.5])box(.18,1.4,.18,palette.wood,x,1,z);box(.12,.12,7,palette.cream,x,1.65,-22.5);}
// Roads, paving and painted direction marks.
slab(74,5.2,.08,palette.path,0,0,.12,2.5);
for(const x of [-25,-7,10,27])slab(4.5,28,.08,palette.path,x,0,.1,2);
for(let x=-35;x<36;x+=3)box(1.25,.015,.11,palette.cream,x,.22,0);
for(const x of [-25,-7,10,27])for(const z of [-6,-4,4,6])box(2.4,.02,.3,'#dfd8bc',x,.23,z);
for(let i=0;i<9;i++)box(.23,.02,3.1,'#f1e7cf',-18+i*.57,.23,0);
for(let i=0;i<34;i++){const x=-39+rand()*78,z=-26+rand()*52;if(Math.abs(z)>4&&Math.abs(z)<10)box(.45,.02,.35,'#c4b593',x,.12,z);}
function grassPatch(x,z,rx,rz,count=70){const geometry=new THREE.ConeGeometry(.12,.65,3),instance=new THREE.InstancedMesh(geometry,mat('#88945b'),count),dummy=new THREE.Object3D();for(let i=0;i<count;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand());dummy.position.set(x+Math.cos(a)*rx*r,.3,z+Math.sin(a)*rz*r);dummy.rotation.set(rand()*.12,rand()*6.28,rand()*.2);dummy.scale.setScalar(.6+rand()*.9);dummy.updateMatrix();instance.setMatrixAt(i,dummy.matrix);instance.setColorAt(i,new THREE.Color(['#879064','#9eaa76','#b7b780'][i%3]));}instance.receiveShadow=true;scene.add(instance);}
function tree(x,z,s=1,color=palette.leaf){const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(s);scene.add(group);cylinder(.18,.28,2.7,palette.wood,0,1.35,0,group,7);for(let i=0;i<5;i++){const a=i*2.4;const leaf=mesh(new THREE.IcosahedronGeometry(1.2,1),i%2?color:mat(color).color.clone().multiplyScalar(1.08).getStyle(),Math.cos(a)*.65,2.7+(i%3)*.55,Math.sin(a)*.65,group);leaf.scale.set(.95,1.15,.85);}colliders.push({x,z,r:.6*s});return group;}
for(const [x,z,s,c] of [[-37,-16,1.35,'#75865b'],[-37,-7,1,'#9a9d61'],[-37,17,1.4,'#b38c53'],[-34,24,1,'#80915c'],[-15,-21,1.35,'#7d8e55'],[-15,20,1.1,'#9c985b'],[1,-22,1.2,'#a3a86e'],[10,25,1.1,'#7e9861'],[19,-21,1.2,'#7c9268'],[19,23,1.25,'#bc976b'],[36,-20,1.4,'#859c6d'],[36,-8,1,'#99a565'],[37,17,1.2,'#798e5b'],[31,24,1,'#a89665']]){tree(x,z,s,c);grassPatch(x,z,2.6,2,65);}
for(const [x,z] of [[-13,-10],[-15,9],[1,9],[19,-10],[35,4],[-35,9],[-2,24],[9,-23]])grassPatch(x,z,1.9,1.4,55);
function rock(x,z,s=1){const m=mesh(new THREE.DodecahedronGeometry(.65,0),'#b5ad97',x,.35*s,z);m.scale.set(s,s*.7,s);m.rotation.set(rand(),rand(),rand());}
for(let i=0;i<26;i++){let x=(rand()-.5)*80,z=(rand()>.5?1:-1)*(23+rand()*3);rock(x,z,.5+rand());}
function bench(x,z,rotation=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);for(let i=0;i<4;i++)box(3,.13,.25,palette.wood,0,.85,-.4+i*.28,g);for(const x1 of [-1.1,1.1]){box(.15,.8,.9,palette.dark,x1,.4,0,g);box(.14,1.6,.15,palette.dark,x1,.8,-.4,g);}for(let i=0;i<3;i++)box(3,.24,.12,palette.wood,0,1.25+i*.28,-.46,g);}
bench(-17,-8);bench(-15,19);bench(19,7,Math.PI/2);bench(35,-2,Math.PI/2);
function lamp(x,z){cylinder(.09,.12,3.6,palette.dark,x,1.8,z);box(.65,.13,.65,palette.dark,x,3.68,z);box(.48,.65,.48,'#f3d58f',x,3.3,z);box(.7,.12,.7,palette.dark,x,2.95,z);}
for(const [x,z] of [[-33,-3],[-15,3],[1,-3],[19,3],[34,-3],[-32,20]])lamp(x,z);

function canvasTexture(draw,w=1024,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return t;}
function boardTexture(title,subtitle,bg=palette.cream){return canvasTexture((c,w,h)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=palette.dark;c.font='500 150px "PingFang SC", sans-serif';c.textAlign='center';c.fillText(title,w/2,h*.49);c.fillStyle='#5b7052';c.font='38px "PingFang SC", sans-serif';c.fillText(subtitle,w/2,h*.73);});}
function planeTexture(texture,w,h,x,y,z,parent=scene){const m=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),x,y,z,parent);m.castShadow=false;return m;}
const nodes=[
 {id:'about',name:'关于刘俊威',x:-25,z:-13,y:6,color:'#42664a'},
 {id:'projects',name:'我的作品',x:-25,z:12,y:6.8,color:'#bd8057'},
 {id:'science',name:'科普工作台',x:-7,z:-13,y:6.5,color:'#6d8c53'},
 {id:'batch',name:'拾片',x:10,z:-13,y:6.5,color:'#bc815c'},
 {id:'voice',name:'声样',x:27,z:-13,y:6.7,color:'#9688a4'},
 {id:'photo',name:'取景',x:-7,z:13,y:6.4,color:'#9e9b69'},
 {id:'motion',name:'动效镜头库',x:10,z:13,y:6.4,color:'#b7817b'},
 {id:'editor',name:'剪辑助手',x:27,z:13,y:6.5,color:'#749d9f'}
];
function pavilion(node,color){const g=new THREE.Group();g.position.set(node.x,0,node.z);scene.add(g);slab(10,9,.35,'#c7c5a5',node.x,node.z,.4,1.2);const floor=bevelBox(8.6,.2,7.2,palette.cream,0,.6,0,g);for(const x of [-3.8,3.8]){box(.24,4.4,.24,palette.wood,x,2.7,-3.5,g);box(.24,4.4,.24,palette.wood,x,2.7,-.3,g);}const roof=bevelBox(9.3,.3,3.8,color,0,5,-2,g);roof.rotation.x=-.07;for(let i=0;i<8;i++)box(.06,.08,3.5,'#d2d6b4',-4+i*1.15,5.21,-2,g);box(5,1.2,3,palette.white,0,1.24,1.4,g);const stripe=box(5,.12,.1,color,0,1.65,2.95,g);colliders.push({x:node.x,z:node.z,r:3.6});g.traverse(o=>{if(o.isMesh){o.userData.station=node.id;nodeMeshes.push(o);}});return g;}
// The home studio.
{
 const n=nodes[0],g=new THREE.Group();g.position.set(n.x,0,n.z);scene.add(g);slab(12,10,.4,'#c6c2a1',n.x,n.z,.4,1.2);
 bevelBox(9,4.8,6.2,palette.cream,0,2.8,-.2,g);box(9.4,.3,6.8,palette.green,0,5.3,-.2,g);box(6.7,2.4,.1,palette.dark,0,3.3,2.95,g);
 planeTexture(boardTexture('刘俊威','科普内容  /  AI 创作'),6.2,2.1,0,3.32,3.02,g);
 box(9.6,.2,2,palette.wood,0,1,3.8,g);for(const x of [-4.3,4.3])box(.2,4.6,.2,palette.wood,x,2.75,4.4,g);const awning=box(9.8,.22,2.5,palette.green,0,5,3.5,g);awning.rotation.x=.08;
 for(let i=0;i<3;i++)box(4-i*.5,.18,1,palette.cream,0,.8-i*.19,4.9+i*.55,g);
 for(let i=0;i<5;i++){const panel=box(1.25,.08,3.6,palette.glass,-3+i*1.5,5.55,-.5,g);panel.rotation.x=-.14;}
 cylinder(.4,.3,1.2,palette.orange,4,1.3,3.8,g);const plant=mesh(new THREE.IcosahedronGeometry(.7,0),palette.leaf,4,2.25,3.8,g);plant.scale.y=1.3;
 colliders.push({x:n.x,z:n.z,r:4.5});g.traverse(o=>{if(o.isMesh){o.userData.station='about';nodeMeshes.push(o);}});
}
// Open-air project screening area, with the actual public project frames.
{
 const n=nodes[1],g=new THREE.Group();g.position.set(n.x,0,n.z);scene.add(g);slab(14,11,.3,'#c9b89b',n.x,n.z,.35,1.8);
 for(const x of [-5.6,5.6])box(.25,5.3,.25,palette.dark,x,2.9,-2,g);
 bevelBox(12.2,5,.3,palette.dark,0,3.5,-2,g);
 const images=['behind-scenes.jpg','coastline.jpg','dry-ice.jpg'];
 images.forEach((src,i)=>{const t=new THREE.TextureLoader().load('assets/projects/'+src);t.colorSpace=THREE.SRGBColorSpace;planeTexture(t,3.7,2.8,-4+i*4,3.7,-1.82,g);});
 planeTexture(boardTexture('参与项目','幕后制作  ·  分形与自然  ·  物理科普',palette.cream),11.8,.9,0,1.55,-1.8,g);
 for(const x of [-4,0,4]){box(2.8,.22,.9,palette.wood,x,.9,2,g);for(const dx of [-1,1])box(.15,.85,.6,palette.dark,x+dx,.5,2,g);}
 colliders.push({x:n.x,z:n.z-2,r:5});g.traverse(o=>{if(o.isMesh){o.userData.station='projects';nodeMeshes.push(o);}});
}
function toolModel(node){const colors={science:'#8ea66a',batch:'#bd8b67',voice:'#a59ab4',photo:'#b5ae80',motion:'#ba8e85',editor:'#81a2a1'};const base=pavilion(node,colors[node.id]);const model=new THREE.Group();model.position.set(0,2.4,1.4);base.add(model);
 if(node.id==='science'){mesh(new THREE.IcosahedronGeometry(.55,1),palette.yellow,0,.3,0,model);for(let i=0;i<3;i++){const r=ring(1.55,palette.green,0,.3,0,model,.07);r.rotation.set(i*.9,i*1.05,.4);const e=mesh(new THREE.SphereGeometry(.2,12,8),palette.orange,Math.cos(i*2.1)*1.55,.3,Math.sin(i*2.1)*1.55,model);}floating.push({object:model,type:'orbit'});}
 if(node.id==='batch'){for(let i=0;i<3;i++){const card=bevelBox(2.5,2.4,.18,[palette.white,palette.mint,palette.yellow][i],-.6+i*.55,.2+i*.17,-i*.4,model);card.rotation.z=-.15+i*.12;const paper=canvasTexture((c,w,h)=>{c.fillStyle=['#f2ead7','#cddcb3','#d6b97e'][i];c.fillRect(0,0,w,h);c.fillStyle='#496248';c.beginPath();c.moveTo(70,430);c.lineTo(360,170);c.lineTo(570,350);c.lineTo(710,230);c.lineTo(940,430);c.fill();c.fillStyle='#c77a51';c.beginPath();c.arc(760,120,50,0,7);c.fill();});const front=planeTexture(paper,2.3,2.15,-.6+i*.55,.2+i*.17,-i*.4+.1,model);front.rotation.z=card.rotation.z;}floating.push({object:model,type:'float'});}
 if(node.id==='voice'){const body=cylinder(.6,.6,2.2,palette.dark,0,.5,0,model,24);mesh(new THREE.SphereGeometry(.6,20,12),palette.dark,0,1.58,0,model);for(let i=0;i<6;i++){const r=ring(.615,'#718878',0,.1+i*.28,0,model,.025);r.rotation.x=Math.PI/2;}const arm=ring(.95,palette.cream,0,.3,0,model,.1);arm.scale.y=1.1;cylinder(.1,.1,1,palette.wood,0,-.65,0,model);cylinder(.85,.85,.12,palette.dark,0,-1.2,0,model);for(let i=0;i<3;i++){const wave=ring(1.5+i*.4,palette.purple,0,.4,-.1,model,.035);wave.scale.x=.8;wave.scale.y=.7;floating.push({object:wave,type:'wave',phase:i});}}
 if(node.id==='editor'){const screen=bevelBox(3.5,2.4,.25,palette.dark,0,.7,0,model);const t=canvasTexture((c,w,h)=>{c.fillStyle='#233f38';c.fillRect(0,0,w,h);c.fillStyle='#bcd59d';for(let i=0;i<4;i++)c.fillRect(55+i*235,260,210,55);c.fillStyle='#d0b280';c.fillRect(55,335,630,40);c.fillStyle='#80a49c';c.fillRect(110,390,770,35);c.fillStyle='#eae7c8';c.beginPath();c.moveTo(470,70);c.lineTo(600,145);c.lineTo(470,220);c.fill();c.fillStyle='#e9aa79';c.fillRect(715,235,5,210);});planeTexture(t,3.25,2.15,0,.7,.14,model);box(.2,.7,.2,palette.dark,0,-.85,0,model);box(1.8,.12,.9,palette.dark,0,-1.25,.15,model);box(2.8,.12,.7,palette.cream,0,-1.2,1,model);}
 if(node.id==='motion'){const group=new THREE.Group();model.add(group);for(let i=0;i<3;i++){const shape=new THREE.Shape();shape.moveTo(-1,-.65);shape.lineTo(.05,0);shape.lineTo(-1,.65);shape.lineTo(-.5,.65);shape.lineTo(.55,0);shape.lineTo(-.5,-.65);shape.closePath();const arrow=mesh(new THREE.ExtrudeGeometry(shape,{depth:.32,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:1}),[palette.cream,palette.pink,palette.orange][i],-1+i*1.2,.3,0,group);arrow.scale.setScalar(1.25);}floating.push({object:group,type:'slide'});}
 if(node.id==='photo'){bevelBox(3.5,2.2,1.5,palette.dark,0,.3,0,model);bevelBox(1.3,.5,1.4,palette.dark,-.4,1.55,0,model);let lens=cylinder(.85,.95,.8,palette.wood,.2,.3,1,model,24);lens.rotation.x=Math.PI/2;lens=cylinder(.72,.72,.1,palette.glass,.2,.3,1.44,model,24);lens.rotation.x=Math.PI/2;let highlight=cylinder(.25,.25,.02,'#adcac0',.4,.5,1.5,model,20);highlight.rotation.x=Math.PI/2;box(.55,.28,.1,palette.yellow,-1,1, .8,model);cylinder(.19,.19,.15,palette.orange,1.1,1.5,.2,model);}
 base.traverse(o=>{if(o.isMesh&&!o.userData.station){o.userData.station=node.id;nodeMeshes.push(o);}});
}
nodes.slice(2).forEach(toolModel);
// Studio lettering made from just three outlined characters, not an embedded font.
async function addName(){try{const data=await(await fetch('assets/name-outlines.json')).json();let i=0;for(const char of '刘俊威'){const path=new THREE.ShapePath();for(const [op,...p] of data[char]){if(op==='M')path.moveTo(...p);if(op==='L')path.lineTo(...p);if(op==='Q')path.quadraticCurveTo(...p);if(op==='C')path.bezierCurveTo(...p);if(op==='Z')path.currentPath.closePath();}const geo=new THREE.ExtrudeGeometry(path.toShapes(false),{depth:.15,bevelEnabled:true,bevelThickness:.012,bevelSize:.008,bevelSegments:2,curveSegments:8});const m=mesh(geo,i===2?palette.orange:palette.green,-10+i*4.8,.35,24);m.scale.setScalar(4.5);m.rotation.y=-.06;i++;}}catch{planeTexture(boardTexture('刘俊威','内容创作者'),13,4.5,-3,2.5,24);}}
addName();
// A wind turbine and small physical props give the island a working rhythm.
{
 cylinder(.17,.3,7,palette.white,36,3.5,-26);const rotor=new THREE.Group();rotor.position.set(36,7,-25.8);scene.add(rotor);mesh(new THREE.SphereGeometry(.3,12,8),palette.orange,0,0,0,rotor);for(let i=0;i<3;i++){const blade=box(.26,2.8,.12,palette.white,0,1.5,0);const arm=new THREE.Group();arm.rotation.z=i*Math.PI*2/3;rotor.add(arm);scene.remove(blade);arm.add(blade);}decorations.push({type:'rotor',mesh:rotor});
}
const props=[];
for(let i=0;i<11;i++){const x=-31+i*6.1,z=i%2?3.2:-3.3;const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);box(.6,.09,.6,palette.dark,0,.1,0,g);cylinder(.08,.28,.75,palette.orange,0,.5,0,g,8);cylinder(.135,.17,.16,palette.cream,0,.58,0,g,8);props.push({object:g,vx:0,vz:0});}

// Compact utility car: body, windshield, headlights, roof rack and four driven wheels.
const car=new THREE.Group();scene.add(car);car.position.set(-22,.05,0);car.rotation.y=Math.PI/2;
bevelBox(1.75,.5,3,palette.orange,0,.9,0,car,.15);box(1.55,.2,2.5,palette.dark,0,.52,0,car);
bevelBox(1.55,.9,1.5,palette.cream,0,1.55,-.35,car,.12);
box(1.34,.62,.03,palette.glass,0,1.58,.43,car);box(1.34,.59,.03,palette.glass,0,1.58,-1.12,car);
for(const x of [-.78,.78])box(.025,.6,1.22,palette.glass,x,1.58,-.34,car);
bevelBox(1.7,.16,1.68,palette.green,0,2.08,-.35,car,.08);
for(const x of [-.63,.63])box(.06,.15,1.4,palette.dark,x,2.23,-.35,car);
for(const z of [-.9,.1])box(1.35,.06,.07,palette.dark,0,2.28,z,car);
box(.65,.34,.68,palette.yellow,0,2.4,-.35,car);
box(1.9,.2,.22,palette.dark,0,.65,1.5,car);box(1.9,.2,.22,palette.dark,0,.65,-1.5,car);
for(const x of [-.6,.6]){box(.4,.25,.05,palette.white,x,1.02,1.52,car);box(.25,.2,.05,'#ae5036',x,.95,-1.52,car);}
for(const x of [-.97,.97])for(const z of [-.95,.95]){const pivot=new THREE.Group();pivot.position.set(x,.55,z);car.add(pivot);const tire=cylinder(.48,.48,.32,palette.tire,0,0,0,pivot,20);tire.rotation.z=Math.PI/2;const hub=cylinder(.23,.23,.34,palette.cream,0,0,0,pivot,16);hub.rotation.z=Math.PI/2;wheels.push({pivot,tire,hub,front:z>0});}
// A soft contact shadow remains readable even with lightweight graphics settings.
const shadowTexture=canvasTexture((c,w,h)=>{const gradient=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gradient.addColorStop(0,'rgba(26,39,24,.4)');gradient.addColorStop(1,'rgba(26,39,24,0)');c.fillStyle=gradient;c.fillRect(0,0,w,h);},128,128);
const carShadow=mesh(new THREE.PlaneGeometry(3.5,4.5),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}),0,.15,0);carShadow.rotation.x=-Math.PI/2;carShadow.castShadow=false;
const cursorRing=ring(.9,palette.white,0,.25,0);cursorRing.rotation.x=-Math.PI/2;cursorRing.visible=false;
const dustGeo=new THREE.IcosahedronGeometry(.12,0),dust=[];
for(let i=0;i<24;i++){const m=mesh(dustGeo,mat('#e6d5b2',{transparent:true,opacity:.45}),0,-10,0);m.castShadow=false;dust.push({mesh:m,life:0});}

// Navigation always works without having to drive.
const dialog=$('info-panel');let lastFocus=null,nearby=null;
function showPanel(kicker,html){lastFocus=document.activeElement;$('panel-kicker').textContent=kicker;$('panel-content').innerHTML=html;keys.clear();speed=0;if(!dialog.open)dialog.showModal();}
function toolPanel(id){const tool=tools.find(t=>t.id===id);if(!tool)return;showPanel(tool.category,`<h2 id="panel-title">${tool.name}</h2><p>${tool.detail}</p><div class="panel-tags">${tool.features.map(f=>`<span>${f}</span>`).join('')}</div><a class="panel-link" href="tools.html?tool=${tool.id}">进入${tool.name}<span>↗</span></a>${tool.local?`<a class="panel-link secondary" href="${tool.local}" target="_blank" rel="noopener noreferrer">打开本机版<span>↗</span></a>`:''}<p class="panel-note">${tool.note}</p>`);tone(540,.08);}
function showSection(id){if(tools.some(t=>t.id===id)){toolPanel(id);return;}if(id==='about')showPanel('关于我',`<h2 id="panel-title">你好，我是<br>刘俊威。</h2><p>一个工科背景的内容创作者。</p><p>我曾在毕导团队参与科普视频制作，用 AI 辅助选题和写脚本，也做剪辑、发布与复盘。</p><p>现在，我把创作里反复遇到的问题做成小工具，让想法更快落到作品里。</p><div class="panel-tags"><span>AI 辅助选题</span><span>脚本</span><span>剪辑</span><span>发布复盘</span></div><a class="panel-link" href="portfolio.html#experience">查看我的经历<span>↗</span></a><a class="panel-link secondary" href="portfolio.html">完整作品集<span>↗</span></a>`);
 if(id==='projects')showPanel('毕导团队 · 我参与的项目',`<h2 id="panel-title">从一个问题，<br>到一条成片。</h2>${[{name:'一条视频的诞生',img:'behind-scenes.jpg',desc:'幕后制作 · 2025.09.13',id:1},{name:'丈量一条海岸线',img:'coastline.jpg',desc:'分形与自然 · 2026.02.11',id:2},{name:'重新认识干冰白雾',img:'dry-ice.jpg',desc:'物理科普 · 2026.03.27',id:3}].map(p=>`<a class="panel-project" href="portfolio.html#project-${p.id}"><img src="assets/projects/${p.img}" alt="${p.name}的成片画面"><h3>${p.name} ↗</h3><p>${p.desc}</p><span>查看成片、个人职责与公开数据</span></a>`).join('')}`);
 if(id==='tools')showPanel('六个工具 · 一个入口',`<h2 id="panel-title">把时间，<br>留给创作。</h2><div class="panel-tools">${tools.map(t=>`<a class="panel-tool" href="tools.html?tool=${t.id}"><span><strong>${t.name}</strong><small>${t.category} · ${t.badge}</small></span><i>↗</i></a>`).join('')}</div><a class="panel-link" href="tools.html">打开完整工具箱<span>↗</span></a>`);
 if(id==='help')showPanel('操作说明',`<h2 id="panel-title">随便逛逛。</h2><p>开着小车靠近工作站，按 Enter 查看内容。也可以直接点击场景路牌，或顶部导航。</p><ul class="help-list"><li>方向键 / WASD：前进、后退和转向</li><li>空格：刹车</li><li>拖动画面：转动视角</li><li>滚轮：拉近或拉远</li><li>R：回到起点</li><li>M：切换全景与跟随</li><li>手机：使用左下角方向按钮</li></ul><a class="panel-link" href="portfolio.html">直接阅读作品集<span>↗</span></a><p class="panel-note">交互灵感来自 Bruno Simon 的可探索作品集。这里的场景为本站独立制作。</p>`);
}
$('close-panel').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{lastFocus?.focus({preventScroll:true});});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.panel)));$('show-help').onclick=()=>showSection('help');
nodes.forEach(node=>{const button=document.createElement('button');button.className='landmark';button.style.setProperty('--mark',node.color);button.innerHTML=`${node.name}<span>↗</span>`;button.setAttribute('aria-label',`查看${node.name}`);button.onclick=()=>showSection(node.id);$('landmarks').appendChild(button);node.label=button;node.anchor=new THREE.Vector3(node.x,node.y,node.z);});

// Driving input, camera orbit, collision response and opt-in synthesized sounds.
const keys=new Set();let speed=0,heading=Math.PI/2,frame=0,drag=null,dustIndex=0,audio=null,audioOn=false;
function tone(frequency=350,length=.04){if(!audioOn)return;try{audio||=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(frequency,audio.currentTime);gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+length);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+length);}catch{audioOn=false;}}
$('sound-toggle').onclick=()=>{audioOn=!audioOn;$('sound-toggle').setAttribute('aria-pressed',String(audioOn));$('sound-toggle').setAttribute('aria-label',audioOn?'关闭音效':'开启音效');$('sound-toggle').title=audioOn?'关闭音效':'开启音效';$('sound-toggle').style.background=audioOn?'#d5dfbc':'';tone(600,.12);};
function startDriving(){if(driving)return;driving=true;overview=false;$('welcome').inert=true;document.body.classList.add('driving');cameraHeight=mobile()?36:39;}
$('start-drive').onclick=()=>{startDriving();$('scene-status').textContent=mobile()?'使用左下角方向按钮，开一圈。':'方向键 / WASD 开车，靠近路牌按 Enter。';$('scene-status').classList.remove('ready');setTimeout(()=>$('scene-status').classList.add('ready'),3500);};
function resetCar(){car.position.set(-22,.05,0);heading=Math.PI/2;car.rotation.y=heading;speed=0;keys.clear();startDriving();overview=false;tone(370,.08);}
$('reset-car').onclick=resetCar;$('map-toggle').onclick=()=>{overview=!overview;if(overview){cameraHeight=mobile()?215:64;document.body.classList.add('driving');}else{startDriving();cameraHeight=mobile()?36:39;}};
const driveKeys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'];
window.addEventListener('keydown',e=>{if(dialog.open||e.metaKey||e.ctrlKey||e.altKey)return;if(driveKeys.includes(e.code)){e.preventDefault();startDriving();keys.add(e.code);}if(e.code==='KeyR')resetCar();if(e.code==='KeyM')$('map-toggle').click();if(e.code==='Enter'&&nearby&&!e.repeat&&!e.target.closest('button,a')){e.preventDefault();showSection(nearby.id);}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();speed=0;});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();speed=0;}});
document.querySelectorAll('[data-drive]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();startDriving();keys.add(b.dataset.drive);b.setPointerCapture(e.pointerId);});const end=()=>keys.delete(b.dataset.drive);b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);b.addEventListener('lostpointercapture',end);});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,lastX:e.clientX,moved:false};renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(drag){const dx=e.clientX-drag.lastX;if(Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)>7)drag.moved=true;if(drag.moved)cameraAngle-=dx*.004;drag.lastX=e.clientX;}});
renderer.domElement.addEventListener('pointerup',e=>{if(drag&&!drag.moved){pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(nodeMeshes,false)[0];if(hit?.object.userData.station)showSection(hit.object.userData.station);}drag=null;});renderer.domElement.addEventListener('pointercancel',()=>drag=null);
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();cameraHeight=THREE.MathUtils.clamp(cameraHeight+e.deltaY*.025,24,85);},{passive:false});
$('interact').onclick=()=>nearby&&showSection(nearby.id);
function resize(){const aspect=innerWidth/innerHeight;camera.left=-cameraViewHeight*aspect/2;camera.right=cameraViewHeight*aspect/2;camera.top=cameraViewHeight/2;camera.bottom=-cameraViewHeight/2;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);}window.addEventListener('resize',resize);resize();
let last=performance.now(),elapsed=0;
function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.035);last=now;if(document.hidden)return;elapsed+=dt;
 const up=keys.has('ArrowUp')||keys.has('KeyW'),down=keys.has('ArrowDown')||keys.has('KeyS'),left=keys.has('ArrowLeft')||keys.has('KeyA'),right=keys.has('ArrowRight')||keys.has('KeyD');
 if(!dialog.open){if(up)speed+=13*dt;if(down)speed-=11*dt;if(!up&&!down)speed*=Math.exp(-1.6*dt);if(keys.has('Space'))speed*=Math.exp(-9*dt);speed=THREE.MathUtils.clamp(speed,-6,12);if(Math.abs(speed)<.025)speed=0;const steering=(left?1:0)-(right?1:0);if(Math.abs(speed)>.15)heading+=steering*dt*1.65*Math.min(1,Math.abs(speed)/3)*Math.sign(speed);
 car.position.x+=Math.sin(heading)*speed*dt;car.position.z+=Math.cos(heading)*speed*dt;
 for(const c of colliders){const dx=car.position.x-c.x,dz=car.position.z-c.z,d=Math.hypot(dx,dz),min=c.r+1.1;if(d<min&&d>.001){car.position.x=c.x+dx/d*min;car.position.z=c.z+dz/d*min;if(Math.abs(speed)>1)tone(130,.04);speed*=-.22;}}
 car.position.x=THREE.MathUtils.clamp(car.position.x,-39.5,39.5);car.position.z=THREE.MathUtils.clamp(car.position.z,-26,26);
 for(const p of props){const dx=p.object.position.x-car.position.x,dz=p.object.position.z-car.position.z,d=Math.hypot(dx,dz);if(d<1.4&&d>.001){p.vx=dx/d*(Math.abs(speed)*.7+1);p.vz=dz/d*(Math.abs(speed)*.7+1);tone(220,.025);}p.object.position.x+=p.vx*dt;p.object.position.z+=p.vz*dt;p.vx*=Math.exp(-3*dt);p.vz*=Math.exp(-3*dt);p.object.rotation.z=THREE.MathUtils.lerp(p.object.rotation.z,-p.vx*.05,dt*5);p.object.rotation.x=THREE.MathUtils.lerp(p.object.rotation.x,p.vz*.05,dt*5);}
 car.rotation.y=heading;car.rotation.z=THREE.MathUtils.lerp(car.rotation.z,steering*Math.abs(speed)*.008,dt*5);car.position.y=.05+Math.sin(elapsed*16)*Math.min(.028,Math.abs(speed)*.003);
 wheels.forEach(w=>{w.pivot.rotation.y=w.front?steering*.25:0;w.tire.rotation.x+=speed*dt*2;w.hub.rotation.x+=speed*dt*2;});
 }
 carShadow.position.set(car.position.x,.15,car.position.z);carShadow.rotation.z=-heading;
 if(!reduced&&Math.abs(speed)>2&&frame%3===0){const d=dust[dustIndex++%dust.length];d.mesh.position.copy(car.position).add(new THREE.Vector3(-Math.sin(heading)*1.5,.2,-Math.cos(heading)*1.5));d.life=1;d.mesh.scale.setScalar(.4+rand());}
 dust.forEach(d=>{if(d.life>0){d.life-=dt;d.mesh.position.y+=dt*.5;d.mesh.scale.multiplyScalar(1+dt*.5);d.mesh.visible=d.life>0;}else d.mesh.visible=false;});
 if(!reduced){floating.forEach(f=>{if(f.type==='orbit')f.object.rotation.y=elapsed*.3;if(f.type==='float')f.object.position.y=2.4+Math.sin(elapsed*1.2)*.12;if(f.type==='slide')f.object.position.x=Math.sin(elapsed*1.5)*.18;if(f.type==='wave')f.object.scale.setScalar(1+Math.sin(elapsed*2+f.phase)*.045);});decorations.forEach(d=>{if(d.type==='rotor')d.mesh.rotation.z=elapsed*.6;if(d.type==='ripple')d.mesh.position.y=.15+Math.sin(elapsed+d.phase)*.007;});}
 const target=overview?(mobile()?new THREE.Vector3(0,0,0):new THREE.Vector3(2,0,0)):(driving?car.position:mobile()?new THREE.Vector3(-20,0,2):new THREE.Vector3(2,0,0));cameraTarget.lerp(target,1-Math.exp(-dt*(reduced?12:3)));
 cameraViewHeight+=(cameraHeight-cameraViewHeight)*(1-Math.exp(-dt*3));camera.position.set(cameraTarget.x+Math.sin(cameraAngle)*56,cameraTarget.y+49,cameraTarget.z+Math.cos(cameraAngle)*56);camera.lookAt(cameraTarget);const aspect=innerWidth/innerHeight;camera.left=-cameraViewHeight*aspect/2;camera.right=cameraViewHeight*aspect/2;camera.top=cameraViewHeight/2;camera.bottom=-cameraViewHeight/2;camera.updateProjectionMatrix();
 nearestUpdate();renderer.render(scene,camera);frame++;
}
const projected=new THREE.Vector3();
function nearestUpdate(){let closest=null,min=Infinity;for(const node of nodes){const d=Math.hypot(car.position.x-node.x,car.position.z-node.z);if(d<min){min=d;closest=node;}projected.copy(node.anchor).project(camera);const x=(projected.x*.5+.5)*innerWidth,y=(-projected.y*.5+.5)*innerHeight;const visible=projected.z<1&&x>35&&x<innerWidth-35&&y>95&&y<innerHeight-105;node.label.style.visibility=visible?'visible':'hidden';node.label.style.left=`${x}px`;node.label.style.top=`${y}px`;node.label.classList.toggle('is-near',d<8&&driving);}
 nearby=min<8?closest:null;$('interact').hidden=!nearby||!driving||dialog.open;if(nearby){$('nearby-name').textContent=nearby.name;cursorRing.visible=driving;cursorRing.position.set(nearby.x,.2,nearby.z+(nearby.z>0?-4.6:4.6));cursorRing.scale.setScalar(1+(!reduced?Math.sin(elapsed*3)*.05:0));}else cursorRing.visible=false;
}
if(mobile()){overview=false;cameraTarget.set(-20,0,2);}else cameraTarget.set(2,0,0);
requestAnimationFrame(tick);$('scene-status').textContent='创作岛已就绪';setTimeout(()=>$('scene-status').classList.add('ready'),1200);document.body.dataset.scene='ready';
const hash=location.hash.slice(1);if(['tools','cases','showcase','intro','about','experience'].includes(hash))setTimeout(()=>showSection(hash==='tools'?'tools':['cases','showcase'].includes(hash)?'projects':'about'),300);
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(h==='tools')showSection('tools');});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('scene-fallback').hidden=false;});
