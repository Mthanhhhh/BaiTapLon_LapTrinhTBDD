-- Carts table (one per user)
CREATE TABLE carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_carts_user_id (user_id)
);

-- Cart items table
CREATE TABLE cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    variant_id BIGINT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    UNIQUE KEY uk_cart_items_cart_product_variant (cart_id, product_id, variant_id),
    INDEX idx_cart_items_cart_id (cart_id)
);

-- Vouchers table
CREATE TABLE vouchers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('PERCENTAGE', 'FIXED') NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    min_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    max_discount DECIMAL(12,2) NULL,
    usage_limit INT NULL,
    used_count INT NOT NULL DEFAULT 0,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vouchers_code (code),
    INDEX idx_vouchers_is_active (is_active)
);

-- Orders table (snapshot shipping address, not FK)
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status ENUM('PENDING_PAYMENT', 'PAID', 'SHIPPING', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    subtotal DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(12,2) NOT NULL,
    fees DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL,
    voucher_id BIGINT NULL,
    shipping_name VARCHAR(255),
    shipping_phone VARCHAR(20),
    shipping_street VARCHAR(500),
    shipping_city VARCHAR(100),
    shipping_country VARCHAR(100),
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
    INDEX idx_orders_user_id (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_created_at (created_at)
);

-- Order items table (snapshot product info)
CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    variant_id BIGINT NULL,
    product_name VARCHAR(500) NOT NULL,
    product_image VARCHAR(500),
    variant_name VARCHAR(255),
    price DECIMAL(12,2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_order_items_order_id (order_id)
);
