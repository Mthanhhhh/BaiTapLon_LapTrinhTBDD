#!/bin/sh
set -eu
export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
if [ -s /bootstrap/data.sql ]; then mysql -uroot "$MYSQL_DATABASE" < /bootstrap/data.sql; else mysql -uroot "$MYSQL_DATABASE" < /schema/owned.sql; fi
mysql -uroot "$MYSQL_DATABASE" -e 'CREATE TABLE IF NOT EXISTS schema_migrations(name VARCHAR(200) PRIMARY KEY,applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);'
for migration in /migrations/*.sql; do
 mysql -uroot "$MYSQL_DATABASE" < "$migration"
 name=$(basename "$migration")
 mysql -uroot "$MYSQL_DATABASE" -e "INSERT IGNORE INTO schema_migrations(name) VALUES('$name');"
done
mysql -uroot "$MYSQL_DATABASE" <<SQL
REVOKE ALL PRIVILEGES, GRANT OPTION FROM '$MYSQL_USER'@'%';
GRANT SELECT,INSERT,UPDATE,DELETE ON \`$MYSQL_DATABASE\`.* TO '$MYSQL_USER'@'%';
FLUSH PRIVILEGES;
SQL
