"""Read public manufacturer catalogs. Cache evidence; never bypass access controls.
Only discovers names/links actually present in the response, not invented SKUs.
"""
import json,re,hashlib,time,urllib.request,urllib.parse,concurrent.futures
from html.parser import HTMLParser
from pathlib import Path
class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[];self.current=None;self.title=False;self.titles=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='a':self.current={'href':a.get('href',''),'text':a.get('aria-label','') or a.get('title','')}
        if tag=='img' and self.current:self.current['text']+=' '+(a.get('alt') or '')
        if tag in ['h1','h2','h3']:self.title=True
    def handle_data(self,data):
        if self.current:self.current['text']+=' '+data
        if self.title:self.titles.append(data.strip())
    def handle_endtag(self,tag):
        if tag=='a' and self.current:self.links.append(self.current);self.current=None
        if tag in ['h1','h2','h3']:self.title=False
sources=[
 ('Apple',32,'https://www.apple.com/vn/iphone/'),
 ('Samsung',32,'https://www.samsung.com/vn/smartphones/'),
 ('Xiaomi',32,'https://www.mi.com/vn/'),
 ('OPPO',32,'https://www.oppo.com/vn/smartphones/'),
 ('vivo',32,'https://www.vivo.com/vn/products'),
 ('HONOR',32,'https://www.honor.com/vn/phones/'),
 ('realme',32,'https://www.realme.com/vn/'),
 ('Motorola',32,'https://www.motorola.com/us/en/'),
 ('Google Pixel',32,'https://store.google.com/category/phones?hl=en-US'),
 ('HMD',32,'https://www.hmd.com/en_int/smartphones'),
]
cache=Path('.tools/official-catalog');cache.mkdir(exist_ok=True,parents=True)
def collect(row):
    brand,category,url=row;key=hashlib.sha256(url.encode()).hexdigest()[:16];target=cache/(key+'.html')
    try:
        if target.exists():html=target.read_text(encoding='utf8')
        else:
            request=urllib.request.Request(url,headers={'User-Agent':'EshopCatalogResearch/1.0','Accept-Language':'vi,en;q=0.8'})
            with urllib.request.urlopen(request,timeout=25) as response:html=response.read().decode('utf8',errors='replace')
            target.write_text(html,encoding='utf8')
        parser=Links();parser.feed(html);links=[];seen=set()
        for link in parser.links:
            href=urllib.parse.urljoin(url,link['href']);text=re.sub(r'\s+',' ',link['text']).strip()
            if href not in seen and text and len(text)<250:links.append({'name':text,'url':href});seen.add(href)
        result={'brand':brand,'categoryId':category,'catalogUrl':url,'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'links':links,'headings':[t for t in parser.titles if t]}
        (cache/(key+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');return result
    except Exception as error:return {'brand':brand,'categoryId':category,'catalogUrl':url,'error':str(error),'links':[]}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:results=list(pool.map(collect,sources))
Path('.tools/official-catalog-discovery.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
for r in results:print(r['brand'],len(r['links']),r.get('error','OK'))
