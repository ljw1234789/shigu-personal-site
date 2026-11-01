"""Convert an approved drawing to matched SVG and shallow 3D geometry.

No font substitution: the full name retains the drawing's proportions and spacing.
Run with the image/scipy/skimage Python environment used by the other name builders.
"""
from pathlib import Path
import argparse
import json
import struct

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates, label
from skimage.measure import marching_cubes, find_contours, approximate_polygon

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--option', choices=['01', '03'], default='03')
option = parser.parse_args().option
out = root / ('assets/sculpture-v8' if option == '01' else 'assets/sculpture-v9')
source = f'approved-{option}.png'
rgb = np.asarray(Image.open(out / source).convert('RGB')).astype(float)
# Blue ink only; this excludes the neutral option number and the paper background.
mask = (rgb[:, :, 2] - rgb[:, :, 0] > 25) & (rgb[:, :, 0] < 165) & (rgb[:, :, 1] < 190)
components, count = label(mask)
sizes = np.bincount(components.ravel())
mask &= sizes[components] > 12
ys, xs = np.where(mask)
mask = np.pad(mask[ys.min():ys.max()+1, xs.min():xs.max()+1], 12)
h, w = mask.shape
distance = gaussian_filter(distance_transform_edt(mask) - distance_transform_edt(~mask), .65)

paths = []
for contour in find_contours(distance, 0):
    points = approximate_polygon(contour, tolerance=.35)
    if len(points) < 4:
        continue
    paths.append('M' + 'L'.join(f'{x:.2f},{y:.2f}' for y, x in points) + 'Z')
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="刘俊威">'
       '<title>刘俊威</title><path fill="#214d82" fill-rule="evenodd" d="' + ''.join(paths) + '"/></svg>')
(out / 'wordmark.svg').write_text(svg)

# Narrow bevels preserve the selected design's stroke tips and inner gaps.
half_depth, bevel = 9., 1.3
z = np.linspace(-half_depth-2, half_depth+2, 25, dtype=np.float32)
qx = bevel-distance[None, :, :]
qz = np.abs(z[:, None, None])-(half_depth-bevel)
field = (np.hypot(np.maximum(qx, 0), np.maximum(qz, 0))
         + np.minimum(np.maximum(qx, qz), 0)-bevel).astype(np.float32)
spacing = (float(z[1]-z[0]), 1., 1.)
verts, faces, _, _ = marching_cubes(field, 0, spacing=spacing, step_size=2, allow_degenerate=False)
coords = np.array([verts[:, 0]/spacing[0], verts[:, 1], verts[:, 2]])
gz, gy, gx = np.gradient(field, *spacing)
normals = np.stack([map_coordinates(gx, coords, order=1), -map_coordinates(gy, coords, order=1),
                    map_coordinates(gz, coords, order=1)], axis=1)
normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-8)
verts[:, 0] += z[0]
scale = 6.45/(w-24)
pos = np.stack([(verts[:, 2]-w/2)*scale, (h/2-verts[:, 1])*scale, verts[:, 0]*scale], axis=1)
quant = 8000
packed = (pos*quant).round().astype('<i2').tobytes()
packed += b'\0'*(-len(packed)%4)
index_bytes = 2 if len(pos) < 65536 else 4
indices = faces.astype('<u2' if index_bytes == 2 else '<u4').tobytes()
data = struct.pack('<IIII', len(pos), faces.size, quant, index_bytes)+packed+indices
data += (normals*32767).round().astype('<i2').tobytes()
(out / 'name-wordmark.bin').write_bytes(data)
report = {'text': '刘俊威', 'source': source, 'viewBox': [w, h],
          'width_world': 6.45, 'height_world': float((h-24)*scale),
          'half_depth_px': half_depth, 'bevel_px': bevel, 'vertices': len(pos),
          'triangles': len(faces), 'bytes': len(data), 'contours': len(paths)}
(out / 'build-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
description = 'custom light serif' if option == '01' else 'custom calligraphic'
(out / 'README.md').write_text(f'Approved option {option}: 刘俊威 {description} wordmark.\n'
    'The user selected the generated drawing on 2026-11-01. SVG and mesh derive from the same outline; '
    'character shapes, spacing and relative placement are preserved. No source font is substituted.\n'
    f'Build: scripts/build-approved-wordmark.py --option {option}. The preview source is retained for reproducibility.\n')
print(json.dumps(report, ensure_ascii=False))
