# Order checkout database update

The order service persists orders and cart rows in `order_db`. Its entity mappings now follow the schema in `infra/mysql/init/04_order_db.sql`.

## Existing MySQL volume

MySQL runs initialization scripts only when its data volume is first created. If you already have an `ecommerce-mysql` volume, apply this one-time change to `order_db` before starting `order-service`:

```sql
ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'PENDING_PAYMENT', 'WAITING_CONFIRMATION', 'WAITING_PICKUP', 'PAID',
    'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED'
  ) NOT NULL DEFAULT 'PENDING_PAYMENT';
```

The same statement is in `infra/mysql/migrations/20261030_order_status_values.sql`. You can run that file with MySQL Workbench after connecting to the local `ecommerce-mysql` instance. This change preserves existing order rows.

For a new MySQL volume, `infra/mysql/init/04_order_db.sql` already creates the status column with these values, so no manual migration is needed.

## Runtime behavior

Order-created Kafka events are dispatched after the order transaction commits. If Kafka is not running locally, order placement still returns without waiting for the broker. The order-service serializes checkout requests for the same cart to prevent duplicate orders from concurrent submissions.
