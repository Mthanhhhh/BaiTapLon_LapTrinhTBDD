import csv, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest = list(csv.DictReader((ROOT / 'scripts/cloudinary-product-manifest.csv').open(encoding='utf-8-sig')))
by_product = {}
for row in manifest:
    by_product.setdefault(row['product'], []).append(row)

# Seed prices are starter prices in VND and must be checked against the actual supplier.
CATALOG = [
 ('iphone-17-pro-max','iPhone 17 Pro Max','Điện thoại',11,34990000,'phone','Màn hình lớn, camera chuyên nghiệp, thân máy cao cấp.', ['DienThoai_Iphone17ProMax_'], ['Dung lượng'], ['256GB','512GB']),
 ('samsung-galaxy-a37','Samsung Galaxy A37 5G','Điện thoại',11,9490000,'phone','Điện thoại 5G dùng hằng ngày, nhiều màu và cấu hình lưu trữ.', ['DienThoai_SamSungA37_'], ['Dung lượng'], ['128GB','256GB']),
 ('xiaomi-17t','Xiaomi 17T','Điện thoại',11,14990000,'phone','Điện thoại Xiaomi dòng T, lựa chọn màu và bộ nhớ.', ['DienThoai_Xiaomi17T_'], ['Dung lượng'], ['256GB','512GB']),
 ('samsung-galaxy-tab-s12','Samsung Galaxy Tab S12','Máy tính bảng',12,18990000,'tablet','Máy tính bảng màn hình lớn cho học tập và giải trí.', ['MayTinhBang_SamSung_'], ['Dung lượng'], ['128GB','256GB']),
 ('xiaomi-pad-8','Xiaomi Pad 8','Máy tính bảng',12,10990000,'tablet','Máy tính bảng Xiaomi đa dụng, nhiều màu.', ['MayTinhBang_XiaomiPad8'], ['Dung lượng'], ['128GB','256GB']),
 ('xiaomi-redmi-pad-2','Xiaomi Redmi Pad 2','Máy tính bảng',12,5990000,'tablet','Máy tính bảng phổ thông cho học tập và giải trí.', ['MayTinhBang_XiaomiRedmiPad2'], ['Dung lượng'], ['128GB','256GB']),
 ('asus-expertbook-p3','ASUS ExpertBook P3 G2 PM3406CHA-LY0089W','Laptop',13,18990000,'laptop','Laptop ASUS ExpertBook, phù hợp học tập và công việc văn phòng.', ['Laptop_Asus_'], [], []),
 ('gigabyte-gaming-a16','Gigabyte Gaming A16 3THK3VN894SH','Laptop',13,27990000,'laptop','Laptop gaming Gigabyte, thiết kế cho học tập và giải trí.', ['Laptop_Gigabyte_'], [], []),
 ('lenovo-ideapad-slim-3','Lenovo IdeaPad Slim 3 14IWC11 Core 4','Laptop',13,14990000,'laptop','Laptop Lenovo gọn nhẹ cho học tập và công việc.', ['Laptop_Lenovo_'], [], []),
 ('msi-modern-15','MSI Modern 15 F1MG 1225VN','Laptop',13,16990000,'laptop','Laptop MSI Modern cho nhu cầu văn phòng và học tập.', ['Laptop_MSI_'], [], []),
 ('baseus-bowie-bs2','Tai nghe Baseus Bowie BS2','Tai nghe',14,499000,'headphones','Tai nghe không dây Baseus, có nhiều lựa chọn màu.', ['TaiNghe_BaseusBS2_'], [], []),
 ('edra-eh406','Tai nghe gaming EDRA EH406 mic dài','Tai nghe',14,599000,'headphones','Tai nghe gaming EDRA với micro cần dài.', ['TaiNghe_EDRA_MicDai_'], [], []),
 ('edra-eh404','Tai nghe gaming EDRA EH404 mic ngắn','Tai nghe',14,449000,'headphones','Tai nghe gaming EDRA với micro gọn.', ['TaiNghe_EDRA_MicNgan_'], [], []),
 ('goojodoq-j248','Tai nghe GOOJODOQ J248','Tai nghe',14,329000,'headphones','Tai nghe Bluetooth GOOJODOQ, nhiều màu.', ['TaiNghe_GOOJODOQ_J248_'], [], []),
 ('strides-sports-shoes','Giày thể thao STRIDES','Giày dép',21,489000,'shoes','Giày thể thao đế êm, nhiều màu; chọn size trước khi thêm giỏ.', ['GiayTheThao_STRIDES_'], ['Kích cỡ'], ['39','40','41','42','43']),
 ('sneaker-gd235','Sneaker GD235 trắng nâu','Giày dép',21,379000,'shoes','Sneaker cổ thấp phối màu trắng nâu, đế cao su.', ['Sneaker_GD235'], ['Kích cỡ'], ['39','40','41','42','43']),
 ('sneaker-gd301','Sneaker GD301','Giày dép',21,429000,'shoes','Sneaker GD301 phối màu, phù hợp đi học và dạo phố.', ['Sneaker_GD301'], ['Kích cỡ'], ['39','40','41','42','43']),
 ('sneaker-gd683','Sneaker GD683 trắng','Giày dép',21,399000,'shoes','Sneaker trắng kiểu dáng tối giản, đế cao su.', ['Sneaker_GD683'], ['Kích cỡ'], ['39','40','41','42','43']),
 ('elent-handbag','Túi xách ELENT','Túi xách',22,459000,'bags','Túi xách ELENT gọn nhẹ, có màu kem và nâu.', ['TuiSach_ELENT_'], [], []),
 ('natoli-handbag','Túi xách NATOLI','Túi xách',22,529000,'bags','Túi xách NATOLI dùng hằng ngày, nhiều màu.', ['TuiSach_Natoli_'], [], []),
 ('leezone-jacket','Áo khoác LEEZONE','Áo khoác',23,549000,'clothing','Áo khoác LEEZONE, chọn màu và kích cỡ phù hợp.', ['AoKhoac_LEEZONE_'], ['Kích cỡ'], ['M','L','XL']),
 ('lados-shirt','Áo sơ mi LADOS','Áo sơ mi',23,329000,'clothing','Áo sơ mi LADOS, nhiều màu; chọn size trước khi đặt.', ['AoSoMi_LADOS_'], ['Kích cỡ'], ['M','L','XL']),
 ('chando-foundation','Kem nền CHANDO','Mỹ phẩm',31,289000,'beauty','Kem nền CHANDO với các tông màu B01, B03 và N02.', ['MyPham_KemNenCHANDO_'], [], []),
 ('cushion-premium','Phấn nước Cushion Premium','Mỹ phẩm',31,399000,'beauty','Phấn nước Cushion Premium; ảnh chi tiết minh hoạ sản phẩm.', ['MyPham_PhanNuocCushionPremium_'], [], []),
 ('florasis-lipstick','Son Florasis','Mỹ phẩm',31,499000,'beauty','Son Florasis với nhiều mã màu để lựa chọn.', ['MyPham_SonFlorasis_'], [], []),
 ('wind-up-toy','Đồ chơi lật đật thú','Đồ chơi',41,99000,'toys','Đồ chơi lật đật hình thú, chọn mẫu yêu thích.', ['DoChoi_LatDat_'], [], []),
 ('toy-race-car','Bộ xe đua đồ chơi','Đồ chơi',41,179000,'toys','Xe đua đồ chơi; bộ ảnh gồm ảnh đại diện và ảnh chi tiết.', ['DoChoi_XeDua_'], [], []),
]

def q(v): return "'" + str(v).replace('\\', '\\\\').replace("'", "''") + "'"
def color_from(filename):
    stem = Path(filename).stem
    if stem.lower() == 'green' or stem.lower() == 'dienthoai_samsunga37_green': return 'Xanh lá'
    m = re.search(r'_(DenCam|DenTrang|TrangKem|TrangNau|XanhTrang|Den|Trang|Kem|Nau|Xam|Xanh|Bac|CamVuTru|XanhDam|Violet|Purple|White|Black|Gray|Silver|Blue|Green|Hong|ChoShiba|GauTruc|Lon|Vet|B01TrangSu|B03TuNhien|N02TrangNga|M\d+)(?:_Anh\d+)?$', stem, re.I)
    if not m: return None
    names={'Den':'Đen','Black':'Đen','DenCam':'Đen-Cam','DenTrang':'Đen-Trắng','TrangKem':'Trắng-Kem','TrangNau':'Trắng-Nâu','XanhTrang':'Xanh-Trắng','Trang':'Trắng','Kem':'Kem','Nau':'Nâu','Xam':'Xám','Gray':'Xám','Green':'Xanh lá','Xanh':'Xanh','Blue':'Xanh dương','Bac':'Bạc','Silver':'Bạc','CamVuTru':'Cam vũ trụ','XanhDam':'Xanh đậm','Violet':'Tím','Purple':'Tím','White':'Trắng','Hong':'Hồng','ChoShiba':'Chó Shiba','GauTruc':'Gấu trúc','Lon':'Heo','Vet':'Vẹt','B01TrangSu':'B01 Trắng sứ','B03TuNhien':'B03 Tự nhiên','N02TrangNga':'N02 Trắng ngà'}
    return names.get(m.group(1), m.group(1).upper())

lines=["-- ONE-TIME CATALOG REPLACEMENT. Backup product_db before running; rerunning creates duplicate products.", "USE product_db;", "SET NAMES utf8mb4;", "START TRANSACTION;", "UPDATE products SET status='HIDDEN', deleted_at=COALESCE(deleted_at,NOW(3)) WHERE deleted_at IS NULL;", "UPDATE categories SET name='Toys',slug='toys',theme_color='#E05A5A',level=1,path='/4/',sort_order=4 WHERE id=4;", "INSERT INTO categories (id,parent_id,name,slug,level,path,sort_order,is_active) VALUES (41,4,'Đồ chơi','toys-items',2,'/4/41/',1,1) ON DUPLICATE KEY UPDATE name=VALUES(name),slug=VALUES(slug),is_active=1;"]
for slug,name,cat,catid,price,kind,pdesc,prefixes,opt2label,opt2values in CATALOG:
    rows=[r for r in by_product.values() for r in r if any(r['file'].startswith(p) for p in prefixes)]
    rows=sorted({r['file']:r for r in rows}.values(),key=lambda r:r['file'])
    if not rows: raise SystemExit('No image files matched '+slug)
    imgs=[r['secureUrl'] for r in rows]
    color_files={}
    for r in rows:
        c=color_from(r['file'])
        if c: color_files.setdefault(c,[]).append(r['secureUrl'])
    image_map=color_files if color_files else {}
    variants=[]
    if kind in ('phone','tablet'):
        colors=list(color_files) or ['Graphite']
        labels=['Màu sắc',*opt2label]
        for c in colors:
            for opt in opt2values:
                variants.append((f'{c} / {opt}',price+(1000000 if opt2values.index(opt)>0 else 0),10))
    elif kind in ('shoes','clothing'):
        colors=list(color_files) or ['Mặc định']; labels=['Màu sắc',*opt2label]
        for c in colors:
            for opt in opt2values: variants.append((f'{c} / {opt}',price,8))
    elif kind=='beauty' and slug=='florasis-lipstick':
        shades=[color_from(r['file']) for r in rows]; labels=['Mã màu']; variants=[(s,price,8) for s in shades]
        image_map={color_from(r['file']):[r['secureUrl']] for r in rows}
    elif kind=='beauty' and slug=='chando-foundation':
        shades=[color_from(r['file']) for r in rows]; labels=['Tông màu']; variants=[(s,price,8) for s in shades]
        image_map={color_from(r['file']):[r['secureUrl']] for r in rows}
    elif kind=='toys' and slug=='wind-up-toy':
        labels=['Mẫu thú']; variants=[(color_from(r['file']),price,12) for r in rows]
        image_map={color_from(r['file']):[r['secureUrl']] for r in rows}
    elif kind in ('headphones','bags') and color_files:
        labels=['Màu sắc']; variants=[(c,price,8) for c in color_files]
    else:
        labels=[]; variants=[('Default',price,10)]
    attrs={'optionLabels':labels,'variantImages':image_map,'specifications':{'danhMuc':cat,'nguonAnh':'Cloudinary'}}
    attrs_json=json.dumps(attrs,ensure_ascii=False,separators=(',',':'))
    base=min(v[1] for v in variants); high=max(v[1] for v in variants)
    lines.append("INSERT INTO products (shop_id,category_id,name,slug,short_description,description,thumbnail_url,currency,min_price,max_price,original_price,attributes,status) VALUES (2,%d,%s,%s,%s,%s,%s,'VND',%d,%d,%d,%s,'ACTIVE');"%(catid,q(name),q(slug),q(pdesc),q(pdesc+' Thông tin cấu hình và hình ảnh được tổng hợp từ bộ ảnh sản phẩm do chủ dự án cung cấp.'),q(imgs[0]),base,high,int(high*1.1),q(attrs_json)))
    lines.append("SET @pid=LAST_INSERT_ID();")
    for i,url in enumerate(imgs):
        lines.append("INSERT INTO product_images (product_id,url,sort_order,is_primary) VALUES (@pid,%s,%d,%d);"%(q(url),i,1 if i==0 else 0))
    for vname,vprice,stock in variants:
        sku=(slug+'-'+re.sub(r'[^a-z0-9]+','-',vname.lower()).strip('-')).upper()[:64]
        lines.append("INSERT INTO product_skus (product_id,sku_code,name,price,original_price,stock_quantity,status) VALUES (@pid,%s,%s,%d,%d,%d,'ACTIVE');"%(q(sku),q(vname),vprice,int(vprice*1.1),stock))
    lines.append("UPDATE products SET status='ACTIVE' WHERE id=@pid;")
lines += ["COMMIT;", "SELECT COUNT(*) AS active_products FROM products WHERE status='ACTIVE' AND deleted_at IS NULL;", "SELECT c.name AS category,COUNT(*) AS products FROM products p JOIN categories c ON c.id=p.category_id WHERE p.status='ACTIVE' AND p.deleted_at IS NULL GROUP BY c.name ORDER BY c.name;"]
(ROOT/'scripts/refresh-real-catalog.sql').write_text('\n'.join(lines)+'\n',encoding='utf-8')
(ROOT/'infra/mysql/init/07_real_catalog.sql').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(f'Generated catalog SQL for {len(CATALOG)} products and {sum(len(v) for v in by_product.values())} images: scripts/refresh-real-catalog.sql')
