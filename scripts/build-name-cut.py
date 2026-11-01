"""Build three straight-sided, shallow-bevel name glyphs; no inflated surfaces."""
from pathlib import Path
import struct, json, io
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image, ImageFont, ImageDraw
import numpy as np
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates
from skimage.measure import marching_cubes

root = Path(__file__).resolve().parents[1]
out = root / 'assets/sculpture-v6'
out.mkdir(exist_ok=True)
base = TTFont(root / 'assets/fonts/ljw-name-rounded-v2.woff2')
report = []
for char, key, weight in zip('刘俊威', ['liu', 'jun', 'wei'], [740, 690, 680]):
    face = instantiateVariableFont(base, {'wght': weight, 'ROND': 0}, inplace=False)
    face.flavor = None
    buf = io.BytesIO(); face.save(buf); buf.seek(0)
    font = ImageFont.truetype(buf, 400)
    bbox = font.getbbox(char)
    w, h = bbox[2]-bbox[0]+80, bbox[3]-bbox[1]+80
    im = Image.new('L', (w, h))
    ImageDraw.Draw(im).text((40-bbox[0], 40-bbox[1]), char, font=font, fill=255)
    mask = np.asarray(im) > 127
    distance = gaussian_filter(distance_transform_edt(mask)-distance_transform_edt(~mask), .55)
    # Flat faces and straight side walls; only the six-pixel perimeter is beveled.
    half_depth, bevel = 22., 5.
    z = np.linspace(-half_depth-3, half_depth+3, 57, dtype=np.float32)
    qx = bevel-distance[None, :, :]
    qz = np.abs(z[:, None, None])-(half_depth-bevel)
    field = (np.hypot(np.maximum(qx, 0), np.maximum(qz, 0))
             + np.minimum(np.maximum(qx, qz), 0)-bevel).astype(np.float32)
    spacing = (float(z[1]-z[0]), 1., 1.)
    verts, faces, _, _ = marching_cubes(field, 0, spacing=spacing, step_size=3, allow_degenerate=False)
    coords = np.array([verts[:, 0]/spacing[0], verts[:, 1], verts[:, 2]])
    gz, gy, gx = np.gradient(field, *spacing)
    normals = np.stack([map_coordinates(gx, coords, order=1),
                        -map_coordinates(gy, coords, order=1),
                        map_coordinates(gz, coords, order=1)], axis=1)
    normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-8)
    verts[:, 0] += z[0]
    scale = 2.02/(h-80)
    pos = np.stack([(verts[:, 2]-w/2)*scale, (h/2-verts[:, 1])*scale, verts[:, 0]*scale], axis=1)
    # Vertex order is z,y,x; the swap and inverted screen y preserve handedness.
    quant = 8000
    packed = (pos*quant).round().astype('<i2').tobytes()
    packed += b'\0'*(-len(packed)%4)
    index_bytes = 2 if len(pos) < 65536 else 4
    indices = faces.astype('<u2' if index_bytes == 2 else '<u4').tobytes()
    data = struct.pack('<IIII', len(pos), faces.size, quant, index_bytes)+packed+indices
    data += (normals*32767).round().astype('<i2').tobytes()
    (out/f'name-{key}.bin').write_bytes(data)
    report.append({'glyph': char, 'weight': weight, 'roundness': 0, 'bevel_px': bevel,
                   'half_depth_px': half_depth, 'vertices': len(pos), 'bytes': len(data)})
    print(report[-1], flush=True)
(out/'build-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
(out/'README.md').write_text('Liu Junwei: straight-sided glyphs with flat faces and narrow beveled edges. Source: Resource Han Rounded (SIL OFL), ROND 0, optical weights 740/690/680. Built by scripts/build-name-cut.py. Binary positions/indices plus normalized int16 normals.\n')
