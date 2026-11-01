from pathlib import Path
import struct,json,io
from fontTools.ttLib import TTFont
import numpy as np
from PIL import Image,ImageFont,ImageDraw,ImageFilter
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import cg
from scipy.ndimage import gaussian_filter,map_coordinates
from skimage.measure import marching_cubes
root=Path(__file__).resolve().parents[1];out=root/'assets/sculpture-v3';out.mkdir(exist_ok=True)
face=TTFont(root/'assets/fonts/ljw-rounded-name.woff2');face.flavor=None;data=io.BytesIO();face.save(data);data.seek(0)
font=ImageFont.truetype(data,400)
report=[]
for char,key in zip('刘俊威',['liu','jun','wei']):
    bbox=font.getbbox(char);w=bbox[2]-bbox[0]+80;h=bbox[3]-bbox[1]+80
    im=Image.new('L',(w,h));ImageDraw.Draw(im).text((40-bbox[0],40-bbox[1]),char,font=font,fill=255,stroke_width=3)
    mask=np.asarray(im.filter(ImageFilter.GaussianBlur(1.2)))>110
    ids=np.full(mask.shape,-1,np.int32);ids[mask]=np.arange(mask.sum());yy,xx=np.where(mask)
    r=[ids[mask]];c=[ids[mask]];v=[np.full(mask.sum(),4.)]
    for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
        ni=ids[yy+dy,xx+dx];valid=ni>=0;r.append(ids[mask][valid]);c.append(ni[valid]);v.append(np.full(valid.sum(),-1.))
    A=coo_matrix((np.concatenate(v),(np.concatenate(r),np.concatenate(c))),shape=(mask.sum(),mask.sum())).tocsr()
    sol,info=cg(A,np.ones(mask.sum()),rtol=1e-7,maxiter=2500);assert info==0
    phi=np.full(mask.shape,-1.,np.float32);phi[mask]=sol;phi=gaussian_filter(phi,1.3)
    depth=1.5;extent=np.sqrt(phi.max()*2)*depth+3;z=np.linspace(-extent,extent,96,dtype=np.float32)
    field=phi[None,:,:]-z[:,None,None]**2/(2*depth**2)
    verts,faces,_,_=marching_cubes(field,0,spacing=(float(z[1]-z[0]),1,1),step_size=3,allow_degenerate=False)
    verts[:,0]+=z[0];faces=faces[:,[0,2,1]]
    # Evaluate the smooth implicit surface gradient, not quantized triangle normals.
    gy,gx=np.gradient(phi);coords=np.array([verts[:,1],verts[:,2]])
    normals=np.stack([-map_coordinates(gx,coords,order=3),map_coordinates(gy,coords,order=3),verts[:,0]/depth**2],axis=1)
    normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-8)
    scale=2.02/(w-80)
    pos=np.stack([(verts[:,2]-w/2)*scale,(h/2-verts[:,1])*scale,verts[:,0]*scale],axis=1)
    quant=8000;raw=(pos*quant).round().astype('<i2').tobytes();raw+=b'\0'*(-len(raw)%4)
    index_bytes=2 if len(pos)<65536 else 4;indices=faces.astype('<u2' if index_bytes==2 else '<u4').tobytes()
    data=struct.pack('<IIII',len(pos),faces.size,quant,index_bytes)+raw+indices+(normals*32767).round().astype('<i2').tobytes()
    (out/f'name-{key}.bin').write_bytes(data)
    report.append({'glyph':char,'vertices':len(pos),'bytes':len(data),'bounds':[pos.min(0).tolist(),pos.max(0).tolist()]})
    print(report[-1],flush=True)
(out/'build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
(out/'README.md').write_text('Original Liu Junwei glyphs, based on LXGW WenKai (SIL OFL). Three independently inflated glyphs. Analytic implicit-surface normals preserve smooth optical highlights. Binary v2 header and positions/indices, followed by normalized int16 xyz normals. See scripts/build-name-optics.py.\n')
