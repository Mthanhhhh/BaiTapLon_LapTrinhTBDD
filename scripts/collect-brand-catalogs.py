"""Collect actual named products from public brand pages/feeds; keep source evidence.
This does not bypass login/traffic checks and never invents a product model to fill a quota.
"""
import sys,json,re,hashlib,time,urllib.request,urllib.parse,concurrent.futures,threading,html
from pathlib import Path
sys.path.insert(0,str(Path('.tools/python-libs').resolve()))
from bs4 import BeautifulSoup
CACHE=Path('.tools/brand-catalog-cache');CACHE.mkdir(parents=True,exist_ok=True)
SOURCES=json.loads(Path('data/brand-catalog-sources.json').read_text(encoding='utf8'))
TIME=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
def fetch(url,json_only=False):
    key=hashlib.sha256(url.encode()).hexdigest();p=CACHE/(key+'.txt')
    if p.exists():return p.read_text(encoding='utf8')
    req=urllib.request.Request(url,headers={'User-Agent':'EshopClassroomCatalog/1.0','Accept':'application/json' if json_only else 'text/html,application/json','Accept-Language':'vi,en;q=0.8'})
    with urllib.request.urlopen(req,timeout=12) as response:
        raw=response.read(6000000).decode('utf8',errors='replace')
    p.write_text(raw,encoding='utf8');return raw
def text(raw):
    value=str(raw or '')
    if '<' not in value:return re.sub(r'\s+',' ',html.unescape(value)).strip()
    return re.sub(r'\s+',' ',BeautifulSoup(value,'html.parser').get_text(' ',strip=True)).strip()
def urlclean(url,base):
    url=urllib.parse.urljoin(base,url or '');parts=urllib.parse.urlsplit(url)
    if parts.scheme not in ('http','https'):return ''
    query=urllib.parse.urlencode([(k,v) for k,v in urllib.parse.parse_qsl(parts.query) if not k.startswith('utm_')])
    return urllib.parse.urlunsplit((parts.scheme,parts.netloc,parts.path,query,''))
def images(value,base):
    if not isinstance(value,list):value=[value]
    result=[]
    for v in value:
        if isinstance(v,dict):v=v.get('src') or v.get('url') or v.get('contentUrl')
        if not isinstance(v,str):continue
        u=urlclean(v,base)
        if u and not re.search(r'logo|placeholder|sprite|favicon|default-og',u,re.I) and u not in result:result.append(u)
    return result[:8]
def walk(obj):
    if isinstance(obj,dict):
        yield obj
        for v in obj.values():yield from walk(v)
    elif isinstance(obj,list):
        for v in obj:yield from walk(v)
def product_json(obj,base):
    kind=obj.get('@type','');kind=kind if isinstance(kind,list) else [kind]
    if not any(x in ('Product','ProductGroup') for x in kind):return None
    name=text(obj.get('name'));url=urlclean(obj.get('url') or base,base)
    if not name or len(name)>255 or not url:return None
    offers=obj.get('offers') or {};offers=offers[0] if isinstance(offers,list) and offers else offers
    if not isinstance(offers,dict):offers={}
    facts=[]
    for v in obj.get('additionalProperty',[]) if isinstance(obj.get('additionalProperty'),list) else []:
        if isinstance(v,dict) and v.get('name') and v.get('value'):facts.append({'label':text(v['name'])[:80],'value':text(v['value'])[:200]})
    for label in ['sku','mpn','model','color','material','size','weight']:
        if obj.get(label) and not isinstance(obj[label],(dict,list)):facts.append({'label':label,'value':text(obj[label])[:200]})
    return {'name':name,'sourceUrl':url,'price':offers.get('price') or offers.get('lowPrice'),'currency':offers.get('priceCurrency'),'images':images(obj.get('image'),base),'facts':facts[:15],'excerpt':text(obj.get('description'))[:150],'sourceKind':'JSON_LD','checkedAt':TIME}
def inspect_html(raw,url):
    soup=BeautifulSoup(raw,'html.parser');products=[]
    for script in soup.find_all('script',type='application/ld+json'):
        try:
            for obj in walk(json.loads(script.string or script.get_text())):
                p=product_json(obj,url)
                if p:products.append(p)
        except (ValueError,TypeError):pass
    links=[];seen=set()
    for a in soup.select('a[href]'):
        u=urlclean(a.get('href'),url);label=text(a.get('aria-label') or a.get('title') or a.get_text(' ',strip=True));img=a.find('img')
        if not label and img:label=text(img.get('alt'))
        if u in seen or not u or urllib.parse.urlsplit(u).netloc.removeprefix('www.')!=urllib.parse.urlsplit(url).netloc.removeprefix('www.'):continue
        path=urllib.parse.urlsplit(u).path
        plausible=re.search(r'/products?/[^/]+|/p/[^/]+|/san-pham/[^/]+|/sp/[^/]+|/dp/[A-Z0-9]+|[^/]+\.html$',path,re.I) or (img and re.search(r'\d|iphone|macbook|airpods|serum|cream|shampoo|dress|shirt|polo',label,re.I))
        if plausible and not re.search(r'privacy|policy|support|account|cart|login|sitemap|blog|news|search|collections|categories|category|all-products|/launch/|/event/',path,re.I):
            if len(path)>15 and len(label)<260:links.append({'url':u,'label':label});seen.add(u)
    return soup,products,links
def feeds(raw,base):
    found=[]
    if re.search(r'shopify|haravan|hstatic|bizweb|sapo',raw,re.I):
        for path in ['products.json?limit=100','collections/all/products.json?limit=100']:
            try:
                data=json.loads(fetch(urllib.parse.urljoin(base,path),True));items=data.get('products') if isinstance(data,dict) else []
                for item in items or []:
                    variants=item.get('variants') or [];first=next((v for v in variants if v.get('available',True)),variants[0] if variants else {})
                    p={'name':text(item.get('title')),'sourceUrl':urllib.parse.urljoin(base,'products/'+item.get('handle','')),'price':first.get('price'),'currency':'VND' if urllib.parse.urlsplit(base).netloc.endswith('.vn') else None,'images':images(item.get('images',[]),base),'facts':[],'excerpt':'','sourceKind':'PUBLIC_PRODUCT_FEED','checkedAt':TIME,'productType':text(item.get('product_type')),'tags':text(item.get('tags')),'vendor':text(item.get('vendor'))}
                    for option in item.get('options') or []:
                        if isinstance(option,dict) and option.get('values'):p['facts'].append({'label':text(option.get('name')),'value':', '.join(map(str,option['values']))[:200]})
                    if p['name']:found.append(p)
                if found:break
            except Exception:pass
    if not found and 'wp-content' in raw:
        try:
            data=json.loads(fetch(urllib.parse.urljoin(base,'wp-json/wc/store/v1/products?per_page=30'),True))
            if isinstance(data,list):
                for item in data:
                    prices=item.get('prices') or {};minor=int(prices.get('currency_minor_unit',2));amount=prices.get('price')
                    found.append({'name':text(item.get('name')),'sourceUrl':item.get('permalink'),'price':float(amount)/10**minor if amount else None,'currency':prices.get('currency_code'),'images':images(item.get('images'),base),'facts':[],'excerpt':'','sourceKind':'PUBLIC_WOOCOMMERCE_FEED','checkedAt':TIME,'productType':text(item.get('categories'))})
        except Exception:pass
    return found
def brand_collect(brand):
    record=CACHE/(brand['key']+'.json')
    if record.exists():return json.loads(record.read_text(encoding='utf8'))
    result={**brand,'products':[],'candidates':[],'errors':[]}
    for source in brand['categories']:
        try:
            raw=fetch(source['url']);soup,products,links=inspect_html(raw,source['url'])
            if not result['products']:products+=feeds(raw,brand['homeUrl'])
            result['products']+=products
            result['candidates'] += [{**link,'categoryId':source['id']} for link in links[:20]]
        except Exception as e:result['errors'].append({'url':source['url'],'error':str(e)})
    unique={p['sourceUrl']:p for p in result['products'] if p.get('sourceUrl')};result['products']=list(unique.values());record.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');return result
if __name__=='__main__':
    only=set(sys.argv[1:]);brands=[b for b in SOURCES if not only or b['key'] in only]
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        for r in pool.map(brand_collect,brands):print(r['key'],len(r['products']),'products,',len(r['candidates']),'links',flush=True)
    all_records=[json.loads(p.read_text(encoding='utf8')) for p in CACHE.glob('*.json')]
    Path('.tools/brand-catalog-discovery.json').write_text(json.dumps(all_records,ensure_ascii=False,indent=2),encoding='utf8')
