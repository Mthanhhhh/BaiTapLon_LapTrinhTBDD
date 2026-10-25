-- Payments table
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    method ENUM('VISA', 'MAESTRO', 'PAYPAL') NOT NULL,
    status ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    amount DECIMAL(12,2) NOT NULL,
    card_last_four VARCHAR(4),
    card_type VARCHAR(20),
    transaction_id VARCHAR(255) UNIQUE,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_payments_order_id (order_id),
    INDEX idx_payments_status (status),
    INDEX idx_payments_transaction_id (transaction_id)
);
