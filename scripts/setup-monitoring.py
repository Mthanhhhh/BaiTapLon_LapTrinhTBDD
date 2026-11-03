"""Initialize private monitoring credentials without printing them or changing existing keys."""
import argparse
import os
from pathlib import Path
import secrets

parser = argparse.ArgumentParser()
parser.add_argument('--env', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
env_path = Path(args.env).resolve()
lines = env_path.read_text(encoding='utf-8-sig').splitlines()
values = dict(line.split('=', 1) for line in lines if '=' in line and not line.lstrip().startswith('#'))
for key, default in [('MONITORING_TOKEN', secrets.token_urlsafe(48)),
                     ('GRAFANA_ADMIN_USER', 'eshop-admin'),
                     ('GRAFANA_ADMIN_PASSWORD', secrets.token_urlsafe(24))]:
    if not values.get(key) or values[key].startswith('REPLACE_'):
        values[key] = default
        lines = [line for line in lines if not line.startswith(key + '=')]
        lines.append(key + '=' + default)
if len(values['MONITORING_TOKEN']) < 32 or len(values['GRAFANA_ADMIN_PASSWORD']) < 16:
    raise SystemExit('Monitoring token must be >=32 characters; Grafana password must be >=16.')
directory = Path(values.get('MONITORING_SECRETS_DIR') or root / '.tools/monitoring').resolve()
directory.mkdir(parents=True, exist_ok=True)
values['MONITORING_SECRETS_DIR'] = directory.as_posix()
lines = [line for line in lines if not line.startswith('MONITORING_SECRETS_DIR=')]
lines.append('MONITORING_SECRETS_DIR=' + directory.as_posix())
for name, value in [('metrics.token', values['MONITORING_TOKEN']), ('grafana.password', values['GRAFANA_ADMIN_PASSWORD'])]:
    file = directory / name
    file.write_text(value, encoding='utf-8')
    # Docker's unprivileged processes must be able to read bind-mounted files.
    if os.name != 'nt': file.chmod(0o644)
(directory / 'LOGIN.txt').write_text('Grafana: http://localhost:3000\nUser: ' + values['GRAFANA_ADMIN_USER'] + '\nPassword: ' + values['GRAFANA_ADMIN_PASSWORD'] + '\nPrometheus: http://localhost:9090\nKeep this file private.\n', encoding='utf-8')
env_path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('Monitoring credentials ready. Private login file:', directory / 'LOGIN.txt')
