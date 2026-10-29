"""Build original, rounded type surfaces from OFL font outlines.
Run with a Python environment containing numpy, scipy, scikit-image, pillow.
Fonts: LXGW WenKai and Fredoka variable, from google/fonts (SIL OFL).
"""
from pathlib import Path
import argparse, struct
import numpy as np
from PIL import Image,ImageFont,ImageDraw,ImageFilter
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import cg
from scipy.ndimage import gaussian_filter
from skimage.measure import marching_cubes
parser=argparse.ArgumentParser();parser.add_argument('--name-font',required=True);parser.add_argument('--fredoka',required=True);parser.add_argument('--output',default='assets/sculpture-v2');args=parser.parse_args();out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
for word,key,face,size in [('刘俊威','name',args.name_font,300),('CRAFT','craft',args.fredoka,300),('&','and',args.fredoka,300),('TASTE','taste',args.fredoka,300)]:
 font=ImageFont.truetype(face,size)
 if face==args.fredoka:
  axes=font.get_variation_axes();font.set_variation_by_axes([700 if b'Weight' in a['name'] else a['default'] for a in axes])
 bbox=font.getbbox(word);w=bbox[2]-bbox[0]+60;h=bbox[3]-bbox[1]+60;im=Image.new('L',(w,h));d=ImageDraw.Draw(im);d.text((30-bbox[0],30-bbox[1]),word,font=font,fill=255,stroke_width=11 if key=='name' else 2)
 mask=np.asarray(im.filter(ImageFilter.GaussianBlur(1.6)),dtype=float)>110
 ids=np.full(mask.shape,-1,np.int32);ids[mask]=np.arange(mask.sum());yy,xx=np.where(mask);r=[ids[mask]];c=[ids[mask]];v=[np.full(mask.sum(),4.)]
 for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
  ni=ids[yy+dy,xx+dx];valid=ni>=0;r.append(ids[mask][valid]);c.append(ni[valid]);v.append(np.full(valid.sum(),-1.))
 A=coo_matrix((np.concatenate(v),(np.concatenate(r),np.concatenate(c))),shape=(mask.sum(),mask.sum())).tocsr();sol,info=cg(A,np.ones(mask.sum()),rtol=2e-6,maxiter=1500);assert info==0,info
 phi=np.full(mask.shape,-1.,np.float32);phi[mask]=sol;phi=gaussian_filter(phi,.8);depth=1.2;extent=np.sqrt(phi.max()*2)*depth+3;z=np.linspace(-extent,extent,80,dtype=np.float32)
 field=phi[None,:,:]-z[:,None,None]**2/(2*depth**2);verts,faces,_,_=marching_cubes(field,0,spacing=(float(z[1]-z[0]),1,1),step_size=3,allow_degenerate=False);verts[:,0]+=z[0];faces=faces[:,[0,2,1]] # Convert marching-cubes winding to outward-facing WebGL triangles.
 span=w-60;scale=(6.5 if key=='name' else (4.4 if key!='and' else 1.5))/span
 pos=np.stack([(verts[:,2]-w/2)*scale,(h/2-verts[:,1])*scale,verts[:,0]*scale],axis=1).astype('<f4')
 # Five mild fairing passes remove voxel facets, while keeping the circular cross section.
 n=len(pos);rr=np.concatenate([faces[:,0],faces[:,1],faces[:,2],faces[:,1],faces[:,2],faces[:,0]]);cc=np.concatenate([faces[:,1],faces[:,2],faces[:,0],faces[:,0],faces[:,1],faces[:,2]])
 W=coo_matrix((np.ones(len(rr)),(rr,cc)),shape=(n,n)).tocsr();deg=np.asarray(W.sum(axis=1)).ravel()[:,None]
 for _ in range(5):pos=(pos*.6+W.dot(pos)/np.maximum(deg,1)*.4).astype('<f4')
 quant=8000;raw=(pos*quant).round().astype('<i2').tobytes();raw+=b'\0'*(-len(raw)%4);idx=2 if len(pos)<65536 else 4;data=struct.pack('<IIII',len(pos),faces.size,quant,idx)+raw+faces.astype('<u2' if idx==2 else '<u4').tobytes();(out/f'{key}.bin').write_bytes(data);print(key,len(pos),'vertices',len(data),'bytes',flush=True)
(out/'README.md').write_text('Original inflated type surfaces for Liu Junwei. Generated from LXGW WenKai (刘俊威) and Fredoka Bold (CRAFT & TASTE), SIL OFL 1.1. Font licenses in ../fonts/. Mesh generation: scripts/build-inflated-type.py. Binary layout: four uint32 values (vertex count, index count, position scale, index bytes); int16 xyz, padded to 4 bytes; uint16 or uint32 indices. No model or artwork from the reference website is included.\n')
