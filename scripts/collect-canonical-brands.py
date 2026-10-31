import importlib.util,json,concurrent.futures,urllib.parse
from pathlib import Path
spec=importlib.util.spec_from_file_location('catalog',Path('scripts/collect-brand-catalogs.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
missing=json.loads(Path('.tools/brand-catalog-missing.json').read_text(encoding='utf8'));keys={x['brand'] for x in missing}
def collect(b):
 p=m.CACHE/(b['key']+'.json');r=json.loads(p.read_text(encoding='utf8'))
 for source in b['categories']:
  u=urllib.parse.urlsplit(source['url']);host=u.netloc
  if not host.startswith('www.') and (len(host.split('.'))==2 or host.endswith('.com.vn')):host='www.'+host
  url=urllib.parse.urlunsplit((u.scheme,host,u.path,u.query,''))
  try:
   raw=m.fetch(url);_,products,links=m.inspect_html(raw,url)
   products+=m.feeds(raw,url)
   for x in products:x.setdefault('categoryHint',source['id'])
   r['products']+=products;r['candidates'] += [{**x,'categoryId':source['id']} for x in links[:24]]
  except Exception:pass
 p.write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf8');return b['key'],len(r['products'])
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
 for key,n in pool.map(collect,[b for b in m.SOURCES if b['key'] in keys]):print(key,n,flush=True)
