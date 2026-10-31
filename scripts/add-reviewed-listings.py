"""Add manually reviewed model names, without inventing specifications or images."""
import json
from pathlib import Path
for entry in json.loads(Path('data/brand-catalog-reviewed-listings.json').read_text(encoding='utf8')):
 p=Path('.tools/brand-catalog-cache')/(entry['brand']+'.json');b=json.loads(p.read_text(encoding='utf8'))
 names={x['name'].lower() for x in b['products']}
 for name in entry['names']:
  if name.lower() in names:continue
  b['products'].append({'name':name,'sourceUrl':entry['url'],'price':None,'currency':None,'images':[],'facts':[{'label':'Model','value':name}],'sourceKind':'REVIEWED_OFFICIAL_MODEL_LIST','checkedAt':'2026-11-01T00:00:00Z','categoryHint':entry['categoryId']})
 p.write_text(json.dumps(b,ensure_ascii=False,indent=2),encoding='utf8')
