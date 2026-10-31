"""Conservative extraction of named product cards carrying a price in browser evidence."""
import json,re
from pathlib import Path
brands={b['key']:b for b in json.loads(Path('data/brand-catalog-sources.json').read_text(encoding='utf8'))}
bad=re.compile(r'^(image|shop|buy|learn|discover|view|see|explore|sign|join|compare|privacy|terms|shipping|support|contact|return|free|save|sale|new arrivals|all |\d|cancel|men.s watches$|women.s watches$)|\n|†|^.{0,5}$',re.I)
count=0
for f in Path('.tools').glob('brand-web-*.json'):
 r=json.loads(f.read_text(encoding='utf8'));key=r['key'];p=Path('.tools/brand-catalog-cache')/(key+'.json')
 if not p.exists():continue
 b=json.loads(p.read_text(encoding='utf8'));raw=r['raw'];raw=raw if isinstance(raw,str) else json.dumps(raw)
 lines=raw.splitlines();seen={x['name'].lower() for x in b['products']}
 for i,line in enumerate(lines):
  for label in re.findall(r'【\d+†([^】]+)】',line):
   label=re.sub(r'[®™]','',label).strip()
   inline=re.match(r'Price ([\d.,]+)₫(.+)',label)
   if inline:label=re.split(r' (?:Originals|Performance|Sportswear|TERREX|Nam Performance|Nam Sportswear)',inline.group(2))[0].strip()
   if bad.search(label) or len(label)>160:continue
   # Product card price must occur before another named link, within the card.
   card=' '.join(lines[i:min(i+9,len(lines))]);card=card.split('】',1)[-1]
   card=re.split(r'【\d+†(?!Image)',card)[0]
   money=re.search(r'\$\s*([\d,]+(?:\.\d{2})?)|([\d.,]+)\s*(?:₫|VND|đ\b)',(' '+inline.group(1)+'₫') if inline else card)
   if not money or label.lower() in seen or not re.search(r'\d',money.group(1) or money.group(2)):continue
   val=money.group(1) or money.group(2);currency='USD' if money.group(1) else 'VND';price=float(val.replace(',','')) if currency=='USD' else float(re.sub(r'[^\d]','',val))
   if price<=0:continue
   seen.add(label.lower());b['products'].append({'name':label,'sourceUrl':r['url'],'price':price,'currency':currency,'images':[],'facts':[],'excerpt':'','sourceKind':'OFFICIAL_BROWSER_LISTING','checkedAt':'2026-11-01T00:00:00Z','categoryHint':r['categoryId']});count+=1
 p.write_text(json.dumps(b,ensure_ascii=False,indent=2),encoding='utf8')
print('Added browser product cards:',count)
