#!/usr/bin/env python3
"""Publish the requested research corpus, keeping source coverage explicit."""
from pathlib import Path
from collections import Counter
from urllib.parse import unquote, quote
import csv, hashlib, json, os, re, shutil, zipfile

REPO = Path(__file__).resolve().parents[1]
OUT = REPO / 'research'
WORK = Path('/Users/ljw/Documents/Codex/个人网站预览/20261103-research')
TAG = 'research-20261103'
RELEASE = 'https://github.com/ljw1234789/shigu-personal-site/releases/download/' + TAG + '/'
ROOTS = {
    'yingjun': Path('/Users/ljw/Documents/Codex/2026-10-30/sh/英俊姐妹日记研究'),
    'selection': Path('/Users/ljw/Documents/Codex/2026-10-30/sh/双账号重剪选片_2026-11-03'),
    'bidao': Path('/Users/ljw/Documents/Codex/2026-10-11/do/bidao-report'),
}
LABELS = {'yingjun':'英俊姐妹日记','selection':'双账号选片','bidao':'毕导','site':'既有作品证据'}
BLOCKED = {'依赖','RapidOCR依赖','OCR依赖','Omni依赖','__pycache__','node_modules','.git','.openai'}
TEXT = {'.txt','.md','.json','.csv','.py','.swift','.m','.sh','.command','.js','.css','.html'}
IMAGES = {'.jpg','.jpeg','.png','.webp'}
MEDIA = {'.mp4','.wav','.m4s'}
RESOURCES = {'.woff2'}
for p in [OUT/'data',OUT/'evidence',OUT/'downloads',OUT/'yingjun/study',OUT/'bidao/report',WORK/'release-media']:
    p.mkdir(parents=True, exist_ok=True)

def digest(b): return hashlib.sha256(b).hexdigest()
def dump(path, value): path.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n')
def scrub(s):
    # These are transient public-page signatures, never needed as login data.
    return re.sub(r'([?&])(?:xsec_token|msToken|verifyFp|fp)=[^&\s"<>\\]*',r'\1',s).replace('?&','?')

entries, excluded, source_map, tasks = [], [], {}, []
for group, root in ROOTS.items():
    for p in sorted(root.rglob('*')):
        if not p.is_file(): continue
        rel=p.relative_to(root); suffix=p.suffix.lower()
        reason = ('软件运行环境或缓存' if any(x in BLOCKED for x in rel.parts) else
                  '系统文件或运行日志' if p.name.startswith('.') or suffix in {'.log','.pyc'} else
                  '编译产物或模型，不是研究正文' if suffix not in TEXT|IMAGES|MEDIA|RESOURCES|{'.zip'} else '')
        if reason:
            excluded.append({'group':group,'source':str(rel),'reason':reason,'bytes':p.stat().st_size});continue
        b=p.read_bytes(); sha=digest(b); kind='image' if suffix in IMAGES else 'media' if suffix in MEDIA else 'resource' if suffix in RESOURCES else 'archive' if suffix=='.zip' else 'document'
        item={'id':digest((group+'/'+str(rel)).encode())[:16],'group':group,'account':LABELS[group],
              'source':str(rel),'title':p.stem,'kind':kind,'format':suffix[1:],'bytes':len(b),'source_sha256':sha}
        item['_path']=p
        if group=='bidao' and str(rel)=='dist/data.json':item['title']='毕导 · 10条作品历史采样（2026-10-11）'
        if kind=='image':
            item['url']='evidence/'+sha[:24]+'.webp'
            tasks.append({'source':str(p),'target':str(OUT/item['url']),'sha256':sha})
            item['treatment']='同尺寸 WebP 阅读副本；原图保留在原始资料包'
        elif kind=='media':
            item['url']=RELEASE+'yingjun-public-media.zip';item['treatment']='公开视频或原声研究副本，收录在媒体资料包'
        elif kind=='resource':
            item['url']='bidao/report/'+str(rel.relative_to('dist')) if group=='bidao' and rel.parts[0]=='dist' else 'downloads/'+sha[:24]+suffix
            target=OUT/item['url'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
            item['treatment']='原报告所需字体资源，原文件直接保留'
        elif kind=='archive':
            item['url']='downloads/'+group+'-'+sha[:12]+'.zip';shutil.copy2(p,OUT/item['url'])
        else:
            item['url']='data/'+item['id']+('.'+item['format'] if suffix in {'.txt','.md','.json','.csv'} else '.txt')
            item['view']='view.html?id='+item['id']
            item['primary']=(group=='yingjun' and (rel.parts[0]=='求职准备总包' or len(rel.parts)==1 and suffix=='.txt') or
                             group=='selection' and (p.name.startswith('00_') or p.name=='10条选片与来源.json') or
                             group=='bidao' and (str(rel) in ['dist/data.json','dist/毕导-10条作品数据.csv'] or rel.parts[0]=='research' and suffix in {'.txt','.md','.json'}))
        entries.append(item);source_map[str(p.resolve())]=item

# Existing portfolio snapshots remain separate from account-wide report data.
site_files=['project-evidence.js','portfolio-narrative.js','assets/projects/metrics-2026-10-14.json']
for name in site_files:
    p=REPO/name;b=p.read_bytes();ident=digest(('site/'+name).encode())[:16]
    item={'id':ident,'group':'site','account':LABELS['site'],'source':name,'title':p.stem,'kind':'document','format':p.suffix[1:],
          'bytes':len(b),'source_sha256':digest(b),'url':'data/'+ident+('.json' if p.suffix=='.json' else '.txt'),
          'view':'view.html?id='+ident,'primary':True,'_path':p}
    entries.append(item);source_map[str(p.resolve())]=item

study_source=ROOTS['yingjun']/'原片联动学习/研究数据.js'
s=study_source.read_text();study=json.loads(s[s.index('{'):].rstrip().rstrip(';'))
media_uploads=[]
compat_file=WORK/'web-media-complete.json'
compat={r['id']:r for r in json.loads(compat_file.read_text())} if compat_file.exists() else {}
for r in study['items']:
    p=(study_source.parent/unquote(r['media'])).resolve();item=source_map[str(p)]
    name='yingjun-'+r['id']+'.mp4';target=WORK/'release-media'/name
    if not target.exists():os.link(p,target)
    item['url']=RELEASE+name;item['treatment']='对应公开视频的研究副本；保留原平台入口'
    web=compat.get(r['id'])
    if web:
        item.update(published_sha256=web['published_sha256'],published_bytes=web['published_bytes'],web_codec='h264',original_codec='hevc',treatment='网页播放使用同尺寸同音轨 H.264 转码；原始 HEVC 及原声保留在完整媒体资料包')
    media_uploads.append({'id':r['id'],'path':web['path'] if web else str(target),'name':name,'sha256':web['published_sha256'] if web else item['source_sha256'],'source_sha256':item['source_sha256']})

missing_refs=[]
def mapped(value, source, base):
    if not isinstance(value,str): return value
    if value.startswith(('http:','https:','data:')):return scrub(value)
    if value.startswith(('../','./','/Users/','file:')):
        name=unquote(value.removeprefix('file://'))
        p=Path(name) if name.startswith('/') else source.parent/name
        item=source_map.get(str(p.resolve()))
        if item:
            url=item.get('view',item['url']) if item['kind']=='document' else item['url']
            return url if url.startswith('https:') else os.path.relpath(OUT/url,base)
        if name.startswith('/Users/'):
            # Keep the research-relative provenance without exposing machine paths.
            for group,root in ROOTS.items():
                if str(p).startswith(str(root)+'/'):return LABELS[group]+'/'+str(p.relative_to(root))
        if value.lower().endswith(('.jpg','.png','.txt','.json','.mp4')):missing_refs.append({'source':str(source.relative_to(ROOTS['yingjun'])) if str(source).startswith(str(ROOTS['yingjun'])) else source.name,'reference':value})
    return scrub(value)

def rewrite(x, source, base):
    if isinstance(x,dict):return {k:rewrite(v,source,base) for k,v in x.items()}
    if isinstance(x,list):return [rewrite(v,source,base) for v in x]
    return mapped(x,source,base)

for item in entries:
    if item['kind']!='document':continue
    p=item['_path'];s=scrub(p.read_text(errors='replace'));target=OUT/item['url']
    if p.suffix=='.json':
        try:s=json.dumps(rewrite(json.loads(s),p,target.parent),ensure_ascii=False,separators=(',',':'))+'\n'
        except json.JSONDecodeError:pass
    target.write_text(s)
    if item.get('primary') and p.suffix in {'.txt','.md'}:item['search']=s[:60000]

# Preserve time-locator labels, with an explicit opt-in view of untouched ASR text.
for r in study['items']:
    raw=ROOTS['yingjun']/'内部分析素材'/r['id']/'自动转写-large-v3-turbo-未听审.json'
    body=json.loads(raw.read_text())['result']['segments']
    r['machine_segments']=[{k:s[k] for k in ['start','end','text']} for s in body if s.get('text','').strip()]
    assert len(r['machine_segments'])==len(r['segments'])
    assert all(abs(a['start']-b['start'])<.02 for a,b in zip(r['machine_segments'],r['segments']))
    r['machine_source']=str(raw)
# The existing learning UI keeps its transcript/decision panels and real native video.
study=rewrite(study,study_source,OUT/'yingjun/study')
(OUT/'yingjun/study/data.js').write_text('window.YINGJUN_REVIEW_DATA='+json.dumps(study,ensure_ascii=False,separators=(',',':'))+';\n')
html=(ROOTS['yingjun']/'原片联动学习/看片与逐句核对.html').read_text()
html=html.replace('src="研究数据.js"','src="data.js?v=20261103-3"').replace('</head>','<link rel="stylesheet" href="../../library.css?v=20261103-3"><link rel="stylesheet" href="../../study-theme.css?v=20261103-3"></head>')
html=html.replace('<body>','<body class="study-page"><a class="study-back" href="../../">← 返回刘俊威的研究档案</a>')
html=html.replace("select(data.items.find(r=>r.id==='7593246079882136883')||data.items[0]);","select(data.items.find(r=>r.id===(new URLSearchParams(location.search).get('id')||'7593246079882136883'))||data.items[0]);")
html=html.replace('showList();highlight()}','showList();highlight();renderCaptionFrames(r);renderClaimChecks(r)}',1)
html=html.replace('renderCaptionFrames(selected);renderClaimChecks(selected);','')
html=html.replace('</body>','<script src="../../study-player.js?v=20261103-3"></script><script src="../../study-transcript.js?v=20261103-3"></script></body>')
(OUT/'yingjun/study/index.html').write_text(html)

# Preserve every original report resource, add only the site's reading palette.
dest=OUT/'bidao/report';shutil.copytree(ROOTS['bidao']/'dist',dest,dirs_exist_ok=True)
for p in dest.glob('*.html'):
    h=p.read_text();h=h.replace('</head>','<link rel="stylesheet" href="../../report-theme.css"></head>')
    h=h.replace('<body','<body',1).replace('</body>','<a class="research-return" href="../../">← 研究档案</a></body>')
    p.write_text(h)

picks=json.loads((ROOTS['selection']/'10条选片与来源.json').read_text())
for p in picks:
    p['screens']=[{**f,'url':source_map[str((ROOTS['selection']/f['file']).resolve())]['url']} for f in p['screens']]

works=[{k:r[k] for k in ['id','index','title','category','caption','duration','published','likes','original']} for r in study['items']]
for r in works:r['study']='yingjun/study/?id='+r['id']
clean=[{k:v for k,v in item.items() if k!='_path'} for item in entries]
dump(OUT/'catalog.json',[i for i in clean if i['kind'] in ['document','archive','resource']])
dump(OUT/'evidence-index.json',[i for i in clean if i['kind'] in ['image','media']])
dump(OUT/'works.json',works);dump(OUT/'picks.json',picks)
dump(OUT/'coverage.json',{'snapshot':'2026-11-03','status':'研究资料归档；完整原声听审未完成，未进行本轮重剪','included':clean,'excluded':excluded,'missing_source_references':missing_refs})
with (OUT/'downloads/source-coverage.csv').open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.writer(f,lineterminator='\n');w.writerow(['资料组','源文件','状态','网站路径','源文件SHA256','字节','处理说明'])
    for i in clean:w.writerow([i['account'],i['source'],'已纳入',i.get('view',i['url']),i['source_sha256'],i['bytes'],i.get('treatment','全文保留；本地关联路径转为网页入口')])
    for i in excluded:w.writerow([LABELS[i['group']],i['source'],'不上传','','',i['bytes'],i['reason']])
stats={'snapshot':'2026-11-03','files':len(clean),'documents':sum(i['kind']=='document' for i in clean),'images':sum(i['kind']=='image' for i in clean),
       'media':sum(i['kind']=='media' for i in clean),'uniqueImages':len({t['sha256'] for t in tasks}),'excluded':len(excluded),'works':len(works),'picks':len(picks),
       'primaryDocuments':sum(bool(i.get('primary')) for i in clean),'transcriptSegments':sum(len(r['segments']) for r in study['items']),
       'decisions':sum(len(r.get('sentence_audit_changes',[])) for r in study['items']),
       'downloads':[{'title':'英俊 · 研究原文与原始证据图','url':RELEASE+'yingjun-research-records.zip'},
                    {'title':'英俊 · 公开原片与原声研究副本','url':RELEASE+'yingjun-public-media.zip'},
                    {'title':'本轮十条选片与全部截图','url':'downloads/selection-evidence.zip'},
                    {'title':'毕导 · 报告与关联研究资料','url':'downloads/bidao-research.zip'},
                    {'title':'源资料到网站的完整覆盖表','url':'downloads/source-coverage.csv'}]}
dump(OUT/'summary.json',stats)
dump(WORK/'image-tasks.json',list({t['sha256']:t for t in tasks}.values()));dump(WORK/'media-uploads.json',media_uploads)

def archive(group,target,media_only=False):
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=3,allowZip64=True) as z:
        for i in entries:
            if i['group']!=group or (i['kind']=='media')!=media_only:continue
            p=i['_path'];name=LABELS[group]+'/'+i['source']
            if p.suffix in TEXT:z.writestr(name,scrub(p.read_text(errors='replace')))
            else:z.write(p,name)
archive('selection',OUT/'downloads/selection-evidence.zip')
archive('bidao',OUT/'downloads/bidao-research.zip')
archive('yingjun',WORK/'yingjun-research-records.zip')
archive('yingjun',WORK/'yingjun-public-media.zip',True)
for row in stats['downloads']:
    path=WORK/row['url'].rsplit('/',1)[-1] if row['url'].startswith('https:') else OUT/row['url']
    row['bytes']=path.stat().st_size
original=next(i for i in clean if i['group']=='bidao' and i['source']=='毕导-IP调研报告-提交包.zip')
stats['downloads'].append({'title':'毕导 · 原离线提交包','url':original['url'],'bytes':original['bytes']})
dump(OUT/'summary.json',stats)
print(json.dumps({'summary':stats,'imageTasks':len({t['sha256'] for t in tasks}),'missingReferences':len(missing_refs),'archivesReady':True},ensure_ascii=False))
