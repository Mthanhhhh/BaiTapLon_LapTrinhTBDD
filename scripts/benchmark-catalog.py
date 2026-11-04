"""Small sequential, read-only probe; latency percentiles here are not a capacity test."""
import argparse, gzip, json, math, statistics, time, urllib.request, urllib.error, uuid
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('--output',required=True)
parser.add_argument('--samples',type=int,default=7)
args=parser.parse_args()
def request(origin,path,body=None):
    start=time.perf_counter()
    req=urllib.request.Request(origin+path,data=json.dumps(body).encode() if body is not None else None,headers={'User-Agent':'Mozilla/5.0 EShopPerformanceProbe/1.0','Content-Type':'application/json','Accept-Encoding':'gzip'})
    try:r=urllib.request.urlopen(req,timeout=30)
    except urllib.error.HTTPError as e:r=e
    wire=r.read();raw=gzip.decompress(wire) if r.headers.get('Content-Encoding')=='gzip' else wire
    return {'ms':round((time.perf_counter()-start)*1000,1),'status':r.status,'wireBytes':len(wire),'jsonBytes':len(raw)},json.loads(raw)
results=[]
for origin in ['http://127.0.0.1:8080','https://api-eshop.mtcord.io.vn']:
    _,catalog=request(origin,'/api/v1/products?size=20')
    ids=[p['id'] for p in catalog['data']['content']]
    cases=[('catalog','/api/v1/products?size=20',None),('search','/api/v1/products/search?keyword=iphone&size=20',None),('filters','/api/v1/products/filter-options',None),('detail','/api/v1/products/'+str(ids[0]),None),('prices','/api/v1/promotions/prices',{'productIds':ids}),('home-empty','/api/v1/ai/recommendations',{'keywords':[],'sessionId':str(uuid.uuid4()),'page':0,'size':20}),('home-search','/api/v1/ai/recommendations',{'keywords':['laptop'],'sessionId':str(uuid.uuid4()),'page':0,'size':20})]
    for name,path,body in cases:
        samples=[request(origin,path,body)[0] for _ in range(args.samples)]
        ordered=sorted(s['ms'] for s in samples)
        row={'origin':origin,'case':name,'path':path,'samples':samples,'medianMs':statistics.median(ordered),'sampleP95Ms':ordered[math.ceil(.95*len(ordered))-1]}
        results.append(row);print(json.dumps({k:v for k,v in row.items() if k!='samples'}),flush=True)
Path(args.output).write_text(json.dumps(results,indent=2)+'\n',encoding='utf-8')
