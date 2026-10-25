-- Seed Categories
INSERT INTO categories (name, slug, parent_id, icon_url, display_order) VALUES
('Electronics', 'electronics', NULL, 'https://example.com/icons/electronics.png', 1),
('Clothing', 'clothing', NULL, 'https://example.com/icons/clothing.png', 2),
('Home & Garden', 'home-garden', NULL, 'https://example.com/icons/home.png', 3),
('Sports', 'sports', NULL, 'https://example.com/icons/sports.png', 4),
('Books', 'books', NULL, 'https://example.com/icons/books.png', 5);

-- Seed Users (Password: '$2a$10$EqKcp1WFKyM3KZbJIFDMp.Q9KXFL6jbWgMhQJ6E.bMu2tPdJYwH2K' for both)
INSERT INTO users (email, password, full_name, phone, role, enabled) VALUES
('admin@ecommerce.com', '$2a$10$EqKcp1WFKyM3KZbJIFDMp.Q9KXFL6jbWgMhQJ6E.bMu2tPdJYwH2K', 'Admin User', '1234567890', 'ADMIN', TRUE),
('buyer@ecommerce.com', '$2a$10$EqKcp1WFKyM3KZbJIFDMp.Q9KXFL6jbWgMhQJ6E.bMu2tPdJYwH2K', 'Buyer User', '0987654321', 'BUYER', TRUE);

-- Seed Products
INSERT INTO products (name, description, price, original_price, category_id, stock, rating, rating_count) VALUES
('Smartphone X', 'Latest smartphone', 999.99, 1099.99, 1, 50, 4.5, 100),
('Laptop Pro', 'High performance laptop', 1499.99, 1599.99, 1, 30, 4.8, 50),
('Cotton T-Shirt', 'Comfortable cotton t-shirt', 19.99, 29.99, 2, 200, 4.0, 300),
('Jeans Classic', 'Classic fit blue jeans', 49.99, 59.99, 2, 100, 4.2, 150),
('Coffee Maker', 'Drip coffee maker', 39.99, 49.99, 3, 40, 4.6, 80),
('Garden Tool Set', 'Complete garden tool kit', 29.99, 35.99, 3, 25, 4.1, 40),
('Tennis Racket', 'Professional tennis racket', 129.99, 149.99, 4, 15, 4.9, 20),
('Yoga Mat', 'Non-slip yoga mat', 24.99, 29.99, 4, 100, 4.7, 120),
('Science Fiction Novel', 'Award winning sci-fi book', 14.99, 19.99, 5, 60, 4.3, 90),
('Cooking Guide', 'Master chef cooking guide', 24.99, 34.99, 5, 45, 4.4, 65);

-- Seed Vouchers
INSERT INTO vouchers (code, type, value, min_order_amount, max_discount, usage_limit, start_date, end_date) VALUES
('WELCOME10', 'PERCENTAGE', 10.00, 0.00, 50.00, 1000, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)),
('FLAT20', 'FIXED', 20.00, 100.00, NULL, 500, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 15 DAY)),
('SUMMER15', 'PERCENTAGE', 15.00, 50.00, 30.00, 200, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 60 DAY));
