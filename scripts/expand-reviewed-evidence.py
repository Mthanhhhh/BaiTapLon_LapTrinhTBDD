import json,re
from pathlib import Path
path=Path('data/brand-catalog-reviewed-listings.json');entries=json.loads(path.read_text(encoding='utf8'))
for key,suffix,pattern,cid in [
 ('microsoft','review',r'^L\d+: (Surface Laptop[^|]+)\s+\| - Windows',33),
 ('dell','catalog',r'^L\d+: ### 【\d+†([^】]+)】',33),
 ('hp','review',r'【\d+†(HP OmniBook[^】]+)】',33),
 ('acer','review',r'^L\d+: ### \d+\. (.+?) - [\$€]',33),
 ('purina','review',r'【(?:2[6-9]|3[0-9])†([^】]+)】',56)
]:
 record=json.loads(Path(f'.tools/brand-web-{key}-{suffix}.json').read_text(encoding='utf8'));names=[]
 for name in re.findall(pattern,record['raw'],re.M):
  name=re.sub(r'[®™]','',name).strip()
  if key=='purina' and not name.startswith('Pro Plan'):name='Purina Pro Plan '+name
  if key=='microsoft':name='Microsoft '+name
  if name not in names:names.append(name)
 entries=[e for e in entries if not(e['brand']==key and e['url']==record['url'])]
 entries.append({'brand':key,'categoryId':cid,'url':record['url'],'names':names[:10]})
path.write_text(json.dumps(entries,ensure_ascii=False,indent=2),encoding='utf8')
