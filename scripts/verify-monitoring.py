"""Verify live targets, real application metrics and provisioned Grafana; never print secrets."""
import argparse
import base64
import json
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--env', required=True)
parser.add_argument('--wait', type=int, default=120)
parser.add_argument('--report')
args = parser.parse_args()
values = dict(line.split('=', 1) for line in Path(args.env).read_text(encoding='utf-8-sig').splitlines() if '=' in line and not line.lstrip().startswith('#'))
prometheus = 'http://127.0.0.1:' + values.get('PROMETHEUS_PORT', '9090')
grafana = 'http://127.0.0.1:' + values.get('GRAFANA_PORT', '3000')
api = 'http://127.0.0.1:' + values.get('PUBLIC_PORT', '18080')
expected = {'auth-service': 1, 'product-service': 2, 'order-service': 2, 'payment-service': 1, 'api-gateway': 2}
results = []

def get(url, auth=False):
    headers = {'User-Agent': 'EShopMonitoringVerification/1.0'}
    if auth:
        raw = (values.get('GRAFANA_ADMIN_USER', 'eshop-admin') + ':' + values['GRAFANA_ADMIN_PASSWORD']).encode()
        headers['Authorization'] = 'Basic ' + base64.b64encode(raw).decode()
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=20) as response:
        return json.load(response)

def query(expression):
    data = get(prometheus + '/api/v1/query?' + urllib.parse.urlencode({'query': expression}))
    if data['status'] != 'success': raise RuntimeError('Prometheus query failed')
    return data['data']['result']

def check(name, passed):
    results.append({'test': name, 'pass': bool(passed)})
    print(('PASS ' if passed else 'FAIL ') + name, flush=True)
    if not passed: raise RuntimeError(name)

try:
    deadline = time.monotonic() + max(0, args.wait)
    counts = {}
    while True:
        try:
            targets = get(prometheus + '/api/v1/targets?state=active')['data']['activeTargets']
            counts = {job: sum(t['health'] == 'up' and t['labels']['job'] == job for t in targets) for job in expected}
            if all(counts[job] == count for job, count in expected.items()): break
        except (OSError, KeyError, ValueError):
            pass
        if time.monotonic() >= deadline: raise RuntimeError('Scrape targets did not become healthy: ' + json.dumps(counts))
        time.sleep(5)
    check('All eight service instances discovered and scraped', all(counts[job] == count for job, count in expected.items()))
    # These are real read-only catalog requests; no fabricated Prometheus samples.
    for _ in range(6): get(api + '/api/v1/products?size=1')
    deadline = time.monotonic() + 45
    while time.monotonic() < deadline:
        observations = query('sum(http_server_requests_seconds_count{application="product-service",status="200"})')
        if observations and float(observations[0]['value'][1]) > 0: break
        time.sleep(3)
    check('Real catalog requests recorded', bool(observations) and float(observations[0]['value'][1]) > 0)
    check('HTTP histogram buckets available for p95', bool(query('http_server_requests_seconds_bucket{application="product-service"}')))
    apps = {x['metric']['application'] for x in query('jvm_memory_used_bytes{area="heap"}')}
    check('JVM metrics from all five applications', set(expected).issubset(apps))
    check('Database pool metrics available', bool(query('hikaricp_connections_active')))
    check('Outbox metrics collection healthy', len(query('eshop_outbox_collection_up == 1')) == 6)
    rules = get(prometheus + '/api/v1/rules')['data']['groups']
    alerts = [r for group in rules for r in group['rules']]
    check('Eight alert rules loaded without errors', len(alerts) == 8 and all(r.get('health') == 'ok' and not r.get('lastError') for r in alerts))
    check('Grafana database healthy', get(grafana + '/api/health')['database'] == 'ok')
    source = get(grafana + '/api/datasources/uid/eshop-prometheus/health', True)
    check('Grafana can query Prometheus', source.get('status') == 'OK')
    dashboard = get(grafana + '/api/dashboards/uid/eshop-operations', True)
    check('Operations dashboard provisioned', dashboard['meta'].get('provisioned') and len(dashboard['dashboard']['panels']) >= 16)
    try:
        get(grafana + '/api/dashboards/uid/eshop-operations')
        anonymous_denied = False
    except urllib.error.HTTPError as error:
        anonymous_denied = error.code in (401, 403)
    check('Dashboard requires login', anonymous_denied)
finally:
    if args.report: Path(args.report).write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')
