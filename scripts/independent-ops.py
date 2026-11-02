"""Private backups and repeatable SQL migrations; secrets stay inside container environments."""
import argparse,subprocess,datetime,pathlib,json
p=argparse.ArgumentParser();p.add_argument("action",choices=["backup","migrate"]);p.add_argument("--env",required=True);p.add_argument("--destination",default=".tools/backups");a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
base=["docker","compose","--env-file",str(pathlib.Path(a.env).resolve()),"-f",str(root/"infra/independent/compose.yml")]
if a.action=="backup":
    folder=pathlib.Path(a.destination).resolve()/datetime.datetime.now().strftime("%Y%m%d-%H%M%S");folder.mkdir(parents=True)
    for owner in ("auth","product","order","payment"):
        with (folder/f"{owner}.sql").open("wb") as out:
            subprocess.run(base+["exec","-T",f"{owner}-db","sh","-c",'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines --triggers --set-gtid-purged=OFF --no-tablespaces "$MYSQL_DATABASE"'],stdout=out,check=True)
    print("Backup completed:",folder)
else:
    for owner in ("auth","product","order","payment"):
        command=base+["exec","-T",f"{owner}-db","sh","-c",'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot "$MYSQL_DATABASE"']
        subprocess.run(command,input=b"CREATE TABLE IF NOT EXISTS schema_migrations(name VARCHAR(200) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);",check=True)
        for migration in sorted((root/f"infra/independent/migrations/{owner}").glob("*.sql")):
            query=f"SELECT COUNT(*) FROM schema_migrations WHERE name='{migration.name}';"
            done=subprocess.check_output(command[:-1]+[command[-1]+" -N -e \""+query+"\""],text=True).strip()
            if done=="1": continue
            sql=migration.read_bytes()+f"\nINSERT INTO schema_migrations(name) VALUES('{migration.name}');\n".encode()
            subprocess.run(command,input=sql,check=True)
            print("Applied",owner,migration.name)

    # Audit tables are append-only for application users. Migration/root credentials stay in ops.
    for owner in ("auth","product","order","payment"):
        script = r"""export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
mysql -uroot "$MYSQL_DATABASE" -e "REVOKE ALL PRIVILEGES, GRANT OPTION FROM '$MYSQL_USER'@'%';"
for table in $(mysql -uroot -N -e "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='$MYSQL_DATABASE' AND TABLE_TYPE='BASE TABLE';"); do
case "$table" in security_audit|domain_audit|commerce_audit) rights='SELECT,INSERT' ;; *) rights='SELECT,INSERT,UPDATE,DELETE' ;; esac
mysql -uroot "$MYSQL_DATABASE" -e "GRANT $rights ON \`$MYSQL_DATABASE\`.\`$table\` TO '$MYSQL_USER'@'%';"
done
"""
        subprocess.run(base+["exec","-T",f"{owner}-db","sh","-c",script],check=True)
        print("Updated least-privilege grants:",owner)
