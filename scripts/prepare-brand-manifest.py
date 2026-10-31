"""Prepare auditable product candidates. Never pad missing products with invented models."""
import json,re,hashlib
from pathlib import Path
brands=json.loads(Path('data/brand-catalog-sources.json').read_text(encoding='utf8'))
if not any((Path('.tools/brand-catalog-cache')/(b['key']+'.json')).exists() for b in brands):
 raise SystemExit('No source cache. Collect and review sources first; existing curated manifest was not changed.')
out=[];missing=[]
bad=re.compile(r'^(all |shop |search|home$|trang chủ|sản phẩm$|products$|new arrivals|collections|access denied|page not found|404|learn more|buy now|view all|discover|explore|contact|about|support|privacy|sign |login|register|image$)',re.I)
for b in brands:
 pth=Path('.tools/brand-catalog-cache')/(b['key']+'.json');r=json.loads(pth.read_text(encoding='utf8')) if pth.exists() else {'products':[]}
 products=[];seen=set()
 for p in r['products']:
  name=re.sub(r'\s+',' ',p.get('name','')).strip()
  name=re.sub(r'^(Thông Số Kỹ Thuật của )','',name,flags=re.I)
  name=re.sub(r'\s+(Tổng quan|Overview)$','',name,flags=re.I)
  p={**p,'name':name}
  if not 5<=len(name)<=230 or bad.search(name) or not p.get('sourceUrl'):continue
  if re.search(r'skip to|giao hàng|hướng dẫn|hoàn tiền|global map|tcl vietnam|trải nghiệm|khám phá|thế hệ sản phẩm|chương trình|collection$|sale tháng|sale \d|www\.|^\(\d+\)$|art of gifting|blue book 20|%|\[gift\]|free gift',name,re.I):continue
  if b['key']=='glasslock':continue # glasslock.com is a security glazing business, not the cookware brand.
  if re.search(r'sinh nhật|vinh danh|hợp tác|kí kết|chung kết|kỷ niệm|kỉ niệm|tech awards|600\+ tên|puppy expertise|^volleyball$|wiener schnitzel|pedro 20:|giá tốt.*(?:fahasa|2025)|bán chạy trên fahasa|bút viết các loại|^dụng cụ học sinh|^dụng cụ văn phòng',name,re.I):continue
  if b['key']=='davines' and not re.search(r'shampoo|conditioner|hair|serum|mask|oil|oi |momo|nounou|love|dede|solu|volu|minu|melu',name,re.I):continue
  if b['key']=='thai-ha-books' and re.search(r'khăn lụa|tượng nghệ thuật',name,re.I):continue
  if b['key']=='tp-link' and not re.search(r'archer|omada|tapo|deco|tl-|[a-z]{1,3}[0-9]{2,}',name,re.I):continue
  if p.get('sourceKind')=='PRODUCT_PAGE' and not(p.get('price') or p.get('facts') or (p.get('images') and re.search(r'\d',name))):continue
  if p.get('sourceKind')=='PRODUCT_PAGE' and re.search(r'/collections?/|/blogs?/|/news/|/tin-tuc/|/campaign|/explore|/story|/about|/support',p['sourceUrl'],re.I):continue
  key=re.sub(r'\W','',name.lower())
  if key in seen:continue
  seen.add(key);products.append(p)
 # Public browser listing evidence is kept for review rather than guessed from navigation labels.
 products.sort(key=lambda p:(p.get('sourceKind')=='PRODUCT_PAGE',not p.get('price'),-len(p.get('facts',[])),-len(p.get('images',[]))))
 classified=[]
 for p in products:
  p={**p,'brandKey':b['key'],'brandName':b['name'],'categoryId':p.get('categoryHint') or b['categories'][0]['id']}
  patterns={32:r'iphone|galaxy [aszf]|redmi (?:note|[0-9])|\bphone\b|reno|find x|honor|realme|vivo|hmd|nokia',33:r'galaxy book|omnibook|elitebook|probook|macbook|laptop|vivobook|zenbook|thinkpad|yoga book|legion|stealth|titan|aorus|gaming a|eagle gl',34:r'ipad|galaxy tab|redmi pad|xiaomi pad|tablet|matepad|nxtpaper|tcl tab',35:r'buds|airpods|headphone|headset|earbud|earphone|quietcomfort|momentum|wh-1000|wf-1000|h390|zone vibe',36:r'smart band|watch|đồng hồ|fēnix|vòng đeo|fitbit',38:r'ssd|ổ cứng|charger|cable|sạc|cáp|hub|dock|mouse|keyboard|bàn phím|chuột|power bank|pin dự phòng|usb|router',39:r'\bnam\b|\bmen.s|\bmale\b',40:r'nữ|\bwomen.s|\bfemale\b|đầm',21:r'giày|sandal|shoes|sneaker|slip-ins|viper court',44:r'cleanser|cleansing|serum|moisturi|sunscreen|spf|dưỡng da|chống nắng|sữa rửa|toner',45:r'lip|son |mascara|foundation|concealer|cushion|eyeshadow|cheek',46:r'shampoo|conditioner|hair|dầu gội|dầu xả|tóc',49:r'máy|nồi cơm|bếp điện|vacuum|air fryer',48:r'chảo|nồi|pan|pot|knife|bình|ly |hộp',50:r'book|sách|novel|tập |cuốn'}
  for cid,pattern in patterns.items():
   if (cid in [c['id'] for c in b['categories']] or (cid in [35,38] and any(c['id'] in [32,33,34,35,36,38] for c in b['categories']))) and re.search(pattern,p['name'],re.I):p['categoryId']=cid;break
  if b['key']=='samsung' and re.search(r'loa |speaker|soundbar|music frame',p['name'],re.I):continue
  if b['key']=='lenovo' and p['name']=='Lenovo Legion Go':continue
  classified.append(p)
 selected=[];groups={}
 for p in classified:groups.setdefault(p['categoryId'],[]).append(p)
 while len(selected)<10 and any(groups.values()):
  for group in groups.values():
   if group and len(selected)<10:selected.append(group.pop(0))
 for p in selected:
  p['sourceKey']=hashlib.sha256((b['key']+'|'+p['sourceUrl']+'|'+p['name']).encode()).hexdigest();out.append(p)
 if len(selected)<10:missing.append({'brand':b['key'],'name':b['name'],'available':len(selected),'needed':10-len(selected),'url':b['homeUrl']})
Path('data/curated-brand-catalog.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
Path('.tools/brand-catalog-missing.json').write_text(json.dumps(missing,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'products':len(out),'completeShops':len(brands)-len(missing),'missingProducts':sum(x['needed'] for x in missing),'missing':missing},ensure_ascii=False))
