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
parser.add_argument('--finish', choices=['shallow', 'sculpted', 'satin', 'rounded'], default='shallow')
args = parser.parse_args()
option = args.option
sculpted = args.finish == 'sculpted'
satin = args.finish == 'satin'
rounded = args.finish == 'rounded'
if (sculpted or satin or rounded) and option != '03':
    parser.error('The sculpted finish is designed for approved option 03.')
out = root / ('assets/sculpture-v13' if rounded else 'assets/sculpture-v11' if satin else 'assets/sculpture-v10' if sculpted else 'assets/sculpture-v8' if option == '01' else 'assets/sculpture-v9')
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
fill = '#72a5d4' if satin else '#5a9ede' if sculpted else '#214d82'
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="刘俊威">'
       f'<title>刘俊威</title><path fill="{fill}" fill-rule="evenodd" d="' + ''.join(paths) + '"/></svg>')
(out / 'wordmark.svg').write_text(svg)
if rounded:
    # Preserve the already approved fallback outline and reference color gradient.
    (out / 'wordmark.svg').write_bytes((root / 'assets/sculpture-v12/wordmark.svg').read_bytes())

# Narrow bevels preserve the selected design's stroke tips and inner gaps.
half_depth, bevel = (65., 65.) if rounded else (55., 17.) if satin else (35., 42.) if sculpted else (9., 1.3)
extent = half_depth + (10 if satin else 2)
z = np.linspace(-extent, extent, 49 if (satin or rounded) else 41 if sculpted else 25, dtype=np.float32)
if sculpted or rounded:
    # A convex face, with its zero-depth silhouette exactly on the approved path.
    # Narrow strokes naturally taper; no dilation closes the letter counters.
    edge = np.exp(np.clip(-distance / bevel, -20, 4)).astype(np.float32)
    field = (np.hypot(edge[None, :, :], z[:, None, None] / half_depth)-1).astype(np.float32)
else:
    qx = bevel-distance[None, :, :]
    qz = np.abs(z[:, None, None])-(half_depth-bevel)
    if satin:
        # A slight crown avoids a completely planar face; most depth remains in
        # the extruded sides rather than inflating every stroke into a tube.
        crown = 8 * (1-np.exp(-np.maximum(distance-bevel, 0)/32))
        qz = qz-crown[None, :, :]
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
          'finish': args.finish,
          'width_world': 6.45, 'height_world': float((h-24)*scale),
          'half_depth_px': half_depth, 'bevel_px': bevel, 'vertices': len(pos),
          'triangles': len(faces), 'bytes': len(data), 'contours': len(paths)}
(out / 'build-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
description = 'custom light serif' if option == '01' else 'custom calligraphic'
(out / 'README.md').write_text(f'Approved option {option}: 刘俊威 {description} wordmark.\n'
    'The user selected the generated drawing on 2026-11-01. SVG and mesh derive from the same outline; '
    'character shapes, spacing and relative placement are preserved. No source font is substituted.\n'
    f'Build: scripts/build-approved-wordmark.py --option {option} --finish {args.finish}. The preview source is retained for reproducibility.\n')
print(json.dumps(report, ensure_ascii=False))
