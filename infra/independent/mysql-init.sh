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
mysql -uroot "$MYSQL_DATABASE" -e "REVOKE ALL PRIVILEGES, GRANT OPTION FROM '$MYSQL_USER'@'%';"
tables=$(mysql -uroot -N -e "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='$MYSQL_DATABASE' AND TABLE_TYPE='BASE TABLE';")
for table in $tables; do
 case "$table" in security_audit|domain_audit|commerce_audit) rights='SELECT,INSERT' ;; *) rights='SELECT,INSERT,UPDATE,DELETE' ;; esac
 mysql -uroot "$MYSQL_DATABASE" -e "GRANT $rights ON \`$MYSQL_DATABASE\`.\`$table\` TO '$MYSQL_USER'@'%';"
done
