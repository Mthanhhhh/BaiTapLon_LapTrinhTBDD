CREATE TABLE IF NOT EXISTS service_outbox (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,table_name VARCHAR(64) NOT NULL,aggregate_key VARCHAR(160) NOT NULL,deleted BOOLEAN NOT NULL DEFAULT FALSE,created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),published_at DATETIME(3),claimed_until DATETIME(3),INDEX ix_outbox_pending(published_at,claimed_until,id));
CREATE TABLE IF NOT EXISTS integration_applied (source_name VARCHAR(30) NOT NULL,table_name VARCHAR(64) NOT NULL,aggregate_key VARCHAR(160) NOT NULL,last_version BIGINT NOT NULL DEFAULT -1,PRIMARY KEY(source_name,table_name,aggregate_key));

CREATE TABLE IF NOT EXISTS integration_bootstrap(source_key VARCHAR(100) PRIMARY KEY,completed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3));
