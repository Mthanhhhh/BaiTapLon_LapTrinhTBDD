import sys,json,re,concurrent.futures,importlib.util,hashlib,urllib.parse
from pathlib import Path
spec=importlib.util.spec_from_file_location('catalog',Path('scripts/collect-brand-catalogs.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def normalize(s):return re.sub(r'[^a-z0-9]','',s.lower())
def brand_ok(p,b):
    # Mattel's global feed contains several distinct brands. Do not relabel them.
    if b['key'] in ['barbie','fisher-price','hot-wheels']:
        token=normalize(b['name']);return token in normalize(p.get('vendor','')+' '+p['name']+' '+p.get('tags',''))
    return True
records=[];work=[]
for f in m.CACHE.glob('*.json'):
    if f.name.startswith('detail-'):continue
    b=json.loads(f.read_text(encoding='utf8'))
    if not isinstance(b,dict) or 'key' not in b:continue
    by_name={}
    for path in ['products.json?limit=100','collections/all/products.json?limit=100']:
        url=urllib.parse.urljoin(b['homeUrl'],path);p=m.CACHE/(hashlib.sha256(url.encode()).hexdigest()+'.txt')
        if p.exists():
            try:
                data=json.loads(p.read_text(encoding='utf8'))
                for v in data.get('products',[]):by_name[m.text(v.get('title'))]=m.text(v.get('vendor'))
            except (ValueError,AttributeError):pass
    for p in b['products']:
        if p['name'] in by_name:p['vendor']=by_name[p['name']]
    b['products']=[p for p in b['products'] if brand_ok(p,b)]
    candidates=list(b.get('candidates',[]))
    for source in b['categories']:
        cache=m.CACHE/(hashlib.sha256(source['url'].encode()).hexdigest()+'.txt')
        if not cache.exists():continue
        try:
            _,_,links=m.inspect_html(cache.read_text(encoding='utf8'),source['url'])
            candidates += [{**x,'categoryId':source['id']} for x in links]
        except Exception:pass
    seen=set();candidates=[x for x in candidates if not(x['url'] in seen or seen.add(x['url']))]
    b['candidates']=candidates;records.append(b)
    if len(b['products'])<15 or len(b['categories'])>1:
        for c in candidates[:24]:work.append((b['key'],c))
def detail(row):
    brand,c=row;url=c['url'];cache=m.CACHE/('detail-'+hashlib.sha256(url.encode()).hexdigest()[:24]+'.json')
    if cache.exists():return brand,json.loads(cache.read_text(encoding='utf8'))
    result=[]
    try:
        raw=m.fetch(url);soup,found,_=m.inspect_html(raw,url)
        result=found
        if not result:
            h=soup.find('h1');meta=soup.find('meta',property='og:title');name=m.text(h.get_text(' ',strip=True) if h else meta.get('content') if meta else '')
            name=re.split(r'\s+[|–]\s+',name)[0].strip()
            blocked=re.search(r'Access Denied|Page Unavailable|Attention Required|403 Forbidden|Please enable cookies',soup.get_text(' ',strip=True)[:2000],re.I)
            generic=re.search(r'^(all |shop |search|products$|sản phẩm$|trang chủ|điện thoại$|smartphones$|home$|laptops$|404|page not found|collections|không tìm thấy)',name,re.I)
            if name and 4<len(name)<=250 and not blocked and not generic:
                image=soup.find('meta',property='og:image');price=soup.find('meta',property='product:price:amount');currency=soup.find('meta',property='product:price:currency')
                facts=[]
                for row in soup.select('table tr'):
                    cells=row.find_all(['th','td'])
                    if len(cells)==2:
                        label=m.text(cells[0].get_text(' ',strip=True));value=m.text(cells[1].get_text(' ',strip=True))
                        if 1<len(label)<70 and 0<len(value)<180:facts.append({'label':label,'value':value})
                result=[{'name':name,'sourceUrl':url,'price':price.get('content') if price else None,'currency':currency.get('content') if currency else None,'images':m.images(image.get('content') if image else [],url),'facts':facts[:15],'excerpt':'','sourceKind':'PRODUCT_PAGE','checkedAt':m.TIME,'categoryHint':c.get('categoryId')}]
        for p in result:p.setdefault('categoryHint',c.get('categoryId'))
    except Exception:pass
    cache.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');return brand,result
by_key={b['key']:b for b in records};print('Detail URLs:',len(work),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=18) as pool:
    for i,(key,products) in enumerate(pool.map(detail,work)):
        by_key[key]['products'] += [p for p in products if brand_ok(p,by_key[key])]
        if (i+1)%100==0:print('Inspected',i+1,flush=True)
for b in records:
    b['products']=list({p['sourceUrl']:p for p in b['products'] if p.get('sourceUrl')}.values())
    (m.CACHE/(b['key']+'.json')).write_text(json.dumps(b,ensure_ascii=False,indent=2),encoding='utf8')
Path('.tools/brand-catalog-discovery.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'brands':len(records),'with10':sum(len(b['products'])>=10 for b in records),'products':sum(len(b['products']) for b in records)},ensure_ascii=False),flush=True)
