-- Categories table (self-referencing for hierarchy)
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    parent_id BIGINT NULL,
    icon_url VARCHAR(500),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id),
    INDEX idx_categories_slug (slug),
    INDEX idx_categories_parent_id (parent_id)
);

-- Products table
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2),
    category_id BIGINT,
    thumbnail_url VARCHAR(500),
    images JSON,
    stock INT NOT NULL DEFAULT 0,
    rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    rating_count INT NOT NULL DEFAULT 0,
    sold_count INT NOT NULL DEFAULT 0,
    attributes JSON,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_products_category_id (category_id),
    INDEX idx_products_price (price),
    INDEX idx_products_rating (rating),
    INDEX idx_products_sold_count (sold_count),
    INDEX idx_products_deleted_at (deleted_at),
    INDEX idx_products_is_active (is_active)
);

-- Product variants table
CREATE TABLE product_variants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(12,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    attributes JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_product_variants_product_id (product_id),
    INDEX idx_product_variants_sku (sku)
);

-- Reviews table
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    emotion VARCHAR(50),
    tags JSON,
    image_urls JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_reviews_user_order_product (user_id, order_id, product_id),
    INDEX idx_reviews_product_id (product_id),
    INDEX idx_reviews_user_id (user_id),
    INDEX idx_reviews_rating (rating)
);
