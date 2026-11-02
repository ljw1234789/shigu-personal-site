"""Build the licensed 400–600 display/body subset used by typography.css.

Usage: python scripts/build-editorial-font.py /path/to/NotoSerifSC.ttf
Requires fonttools[woff] and brotli.
"""
from pathlib import Path
import sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parents[1]
sources = [
    'index.html', 'portfolio.html', 'tools.html', 'homepage.js',
    'site-data.js', 'project-evidence.js', 'tool-catalog.js',
    'tool-presentation.js', 'toolbox.js',
]
text = ''.join((root / name).read_text() for name in sources)
font = TTFont(sys.argv[1])
options = subset.Options()
options.name_IDs = ['*']
options.name_legacy = True
builder = subset.Subsetter(options=options)
builder.populate(text=text)
builder.subset(font)
font = instantiateVariableFont(font, {'wght': (400, 600)}, inplace=True)
names = {1: 'LJW Editorial', 2: 'Regular', 4: 'LJW Editorial',
         6: 'LJWEditorial', 16: 'LJW Editorial', 17: 'Regular'}
for record in font['name'].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
font.flavor = 'woff2'
target = root / 'assets/fonts/ljw-editorial-serif.woff2'
font.save(target)
missing = sorted({c for c in text if '\u4e00' <= c <= '\u9fff'} -
                 {chr(c) for c in font.getBestCmap()})
if missing:
    raise RuntimeError(f'Missing Chinese glyphs: {missing}')
print(f'{target.name}: {target.stat().st_size:,} bytes; all content glyphs covered')
