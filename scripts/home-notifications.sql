CREATE TABLE IF NOT EXISTS auth_db.app_notifications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 event_key VARCHAR(120) NOT NULL,
 type VARCHAR(20) NOT NULL,
 title VARCHAR(200) NOT NULL,
 body VARCHAR(500) NOT NULL,
 order_id BIGINT UNSIGNED NULL,
 is_read BOOLEAN NOT NULL DEFAULT FALSE,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_notification_event(user_id,event_key),
 INDEX idx_notification_inbox(user_id,created_at)
);

SET NAMES utf8mb4;
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Điện thoại','dien-thoai',1,'/',100,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='dien-thoai');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Laptop','may-tinh-xach-tay',1,'/',101,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='may-tinh-xach-tay');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Máy tính bảng','may-tinh-bang',1,'/',102,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='may-tinh-bang');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Tai nghe','tai-nghe',1,'/',103,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='tai-nghe');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Đồng hồ','dong-ho',1,'/',104,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='dong-ho');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Máy ảnh','may-anh',1,'/',105,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='may-anh');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Phụ kiện công nghệ','phu-kien-cong-nghe',1,'/',106,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='phu-kien-cong-nghe');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Thời trang nam','thoi-trang-nam',1,'/',107,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='thoi-trang-nam');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Thời trang nữ','thoi-trang-nu',1,'/',108,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='thoi-trang-nu');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Giày dép','giay-dep',1,'/',109,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='giay-dep');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Túi xách','tui-xach',1,'/',110,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='tui-xach');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Trang sức','trang-suc',1,'/',111,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='trang-suc');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Chăm sóc da','cham-soc-da',1,'/',112,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='cham-soc-da');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Trang điểm','trang-diem',1,'/',113,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='trang-diem');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Chăm sóc tóc','cham-soc-toc',1,'/',114,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='cham-soc-toc');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Nhà cửa & đời sống','nha-cua-doi-song',1,'/',115,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='nha-cua-doi-song');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Nhà bếp','nha-bep',1,'/',116,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='nha-bep');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Đồ gia dụng','do-gia-dung',1,'/',117,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='do-gia-dung');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Sách','sach',1,'/',118,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='sach');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Văn phòng phẩm','van-phong-pham',1,'/',119,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='van-phong-pham');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Thể thao','the-thao',1,'/',120,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='the-thao');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Du lịch','du-lich',1,'/',121,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='du-lich');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Mẹ & bé','me-va-be',1,'/',122,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='me-va-be');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Đồ chơi','do-choi',1,'/',123,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='do-choi');
INSERT INTO product_db.categories(name,slug,level,path,sort_order,is_active) SELECT 'Thú cưng','thu-cung',1,'/',124,1 WHERE NOT EXISTS(SELECT 1 FROM product_db.categories WHERE slug='thu-cung');
