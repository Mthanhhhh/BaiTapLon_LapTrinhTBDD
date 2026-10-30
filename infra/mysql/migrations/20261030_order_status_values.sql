-- Apply once to existing order_db databases (init scripts only run for a new MySQL volume).
ALTER TABLE orders
  MODIFY COLUMN status ENUM('PENDING_PAYMENT','WAITING_CONFIRMATION','WAITING_PICKUP','PAID','SHIPPING','DELIVERED','CANCELLED','RETURNED') NOT NULL DEFAULT 'PENDING_PAYMENT';
