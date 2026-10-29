from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import cg
from scipy.ndimage import gaussian_filter
from skimage.measure import marching_cubes
import argparse, struct
parser=argparse.ArgumentParser(description='Build the three rounded name meshes; requires numpy, scipy, scikit-image and pillow.')
parser.add_argument('--font',required=True,help='Path to the SIL OFL LXGWWenKai-Regular.ttf')
parser.add_argument('--output',default=str(Path(__file__).resolve().parents[1]/'assets/sculpture'))
args=parser.parse_args()
out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype(args.font,216)
for char,key in zip('刘俊威',['liu','jun','wei']):
 im=Image.new('L',(288,288));draw=ImageDraw.Draw(im);bbox=font.getbbox(char);draw.text(((288-(bbox[2]-bbox[0]))/2-bbox[0],(288-(bbox[3]-bbox[1]))/2-bbox[1]),char,font=font,fill=255,stroke_width=4)
 arr=np.asarray(im.filter(ImageFilter.GaussianBlur(1.6)),dtype=float)/255
 mask=arr>.42
 # Inflated membrane: a Poisson solution yields continuously curved faces and rounded stroke junctions.
 ids=np.full(mask.shape,-1,dtype=np.int32);ids[mask]=np.arange(mask.sum());yy,xx=np.where(mask);row=[ids[mask]];col=[ids[mask]];data=[np.full(mask.sum(),4.)]
 for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
  nids=ids[yy+dy,xx+dx];valid=nids>=0;row.append(ids[mask][valid]);col.append(nids[valid]);data.append(np.full(valid.sum(),-1.))
 A=coo_matrix((np.concatenate(data),(np.concatenate(row),np.concatenate(col))),shape=(mask.sum(),mask.sum())).tocsr()
 sol,info=cg(A,np.ones(mask.sum()),rtol=1e-6,maxiter=1200)
 assert info==0,info
 phi=np.full(mask.shape,-1.0,dtype=np.float32);phi[mask]=sol
 phi=gaussian_filter(phi,.75)
 h=np.sqrt(max(phi.max(),0)*2)*1.2
 z=np.linspace(-h-4,h+4,80,dtype=np.float32)
 field=phi[None,:,:]-z[:,None,None]**2/(2*1.2**2)
 verts,faces,_,_=marching_cubes(field,0,spacing=(float(z[1]-z[0]),1,1),step_size=2,allow_degenerate=False)
 verts[:,0]+=z[0]
 # gl convention: X right, Y up, Z toward viewer; normalize glyph em to 1.
 positions=np.stack([(verts[:,2]-144)/216,(144-verts[:,1])/216,verts[:,0]/216],axis=1).astype('<f4')
 # The coordinate permutation and Y reflection preserve orientation.
 faces=faces.astype('<u4')
 # Gently fair the extracted surface to remove voxel shading without flattening the inflated face.
 n=len(positions);r=np.concatenate([faces[:,0],faces[:,1],faces[:,2],faces[:,1],faces[:,2],faces[:,0]]);c=np.concatenate([faces[:,1],faces[:,2],faces[:,0],faces[:,0],faces[:,1],faces[:,2]])
 W=coo_matrix((np.ones(len(r)),(r,c)),shape=(n,n)).tocsr();deg=np.asarray(W.sum(axis=1)).ravel()[:,None]
 for _ in range(3):positions=(positions*.55+W.dot(positions)/np.maximum(deg,1)*.45).astype('<f4')
 header=struct.pack('<II',len(positions),len(faces)*3)
 packed=(positions*30000).round().astype('<i2')
 assert len(positions)<65536
 (out/f'{key}.bin').write_bytes(header+packed.tobytes()+faces.astype('<u2').tobytes())
 print(char,len(positions),'vertices',len(faces),'faces',len(header+positions.tobytes()+faces.tobytes()),flush=True)
(out/'README.md').write_text('Original inflated mesh models generated for Liu Junwei, 2026-10-29. Based on the three glyph outlines from LXGW WenKai, SIL OFL 1.1; see ../fonts/OFL-LXGWWenKai.txt. Surfaces generated from a Poisson membrane solve, with smooth stroke junctions rather than flat extrusions. Binary: little-endian uint32 vertexCount/indexCount, int16 positions scaled by 30000, uint16 triangle indices.\n')
