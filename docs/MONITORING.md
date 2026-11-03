# D9 — Prometheus and Grafana

Prometheus periodically reads numeric metrics from running services. Grafana queries this time-series database and draws dashboards. Unlike Actuator health (UP/DOWN), this shows changes over time: request rate, error rate, p95 latency, JVM memory, connection pool saturation and unpublished events.

## Use on the server

- Grafana: **http://localhost:3000/d/eshop-operations**
- Prometheus: **http://localhost:9090**; targets at `/targets`, alerts at `/alerts`.
- User: `eshop-admin` by default. Read the generated password from **`T:/ProjectTBDD/.tools/monitoring/LOGIN.txt`**. Credentials are outside Git. Do not share the scrape token or expose these ports through Cloudflare.
- The 18-panel dashboard is provisioned from source under `infra/independent/monitoring/grafana`; select service/instance and time range at the top. Idle periods can have no p95 sample; they must not be interpreted as zero latency.

## What is collected

| Area | Measurements |
|---|---|
| HTTP | Request/second, response status, server error ratio, histogram p95 |
| JVM | Heap usage/limit, process CPU, GC pauses, threads, uptime |
| Database | Hikari active and pending connections (not a full MySQL server exporter) |
| Kafka integration | Projection/command Outbox pending records and oldest age from each service's own DB (not a broker/JMX exporter) |
| Availability | Every discovered service instance and monitoring collection failures |

Docker DNS discovery finds every replica independently; it does not scrape through Nginx load balancing. Current deployment expects eight application targets: Auth 1, Product 2, Order 2, Payment 1, Gateway 2. Prometheus itself is an additional target. Outbox panels use MAX across replicas so the same DB queue is not counted twice. Collection errors produce NaN and a health=0 gauge, never a misleading empty queue.

Prometheus scrapes every 15 seconds. Two indexed local Outbox queries run every 30 seconds per service instance. Histograms use bounded route/status labels, with no buyer/order/email labels. Heap graphs show JVM heap, not total host/container RAM.

## Alerts and resource limits

Eight rules cover scrape failure, missing services, sustained 5xx ratio, p95 >1.5 seconds, JVM heap >85%, DB connection waiters, old Outbox records and failed Outbox measurement. Low-traffic guards reduce false latency/error alerts. A failed scrape can mean credential/network problems rather than a crashed application.

Alerts are visible in Prometheus and the dashboard's firing-alert count. **External email/webhook delivery is not configured.** Rules are validated and tested with promtool, including firing and recovery; fixtures are test-only inputs, not production samples.

Retention is 7 days or 512 MB of TSDB blocks, whichever limit applies. WAL/head and Grafana data use extra disk space; this is not a hard 512 MB total-directory cap. Prometheus and Grafana each have a 320 MB container memory cap and Go soft limit 192 MiB. Volumes persist across deployments.

## Security and setup

`/actuator/prometheus` requires a dedicated constant-time-compared bearer credential on all five applications. Normal customer/admin JWTs do not grant scrape access. Nginx blocks public `/actuator/**` except health. Neither monitoring port listens on a public interface; Grafana anonymous access and signup are disabled.

Initialization is called by startup/deploy scripts:

```powershell
py -3 scripts/setup-monitoring.py --env .env.independent.local
py -3 scripts/verify-monitoring.py --env .env.independent.local --wait 150
```

The helper preserves existing credentials and writes ignored secret files. On Linux, the containing secrets directory must be accessible only to trusted operators; token files must remain readable by the unprivileged container processes. To rotate an established Grafana password, change it through Grafana's authenticated password-management flow first, then update private configuration; changing bootstrap environment values alone does not reset an existing Grafana database password.

Prometheus and alert configuration: `infra/independent/monitoring`. CI checks rule syntax and firing/recovery tests. The live verifier checks all eight targets, real read-only catalog traffic, JVM/DB/Outbox metrics, loaded alert rules, Grafana datasource/dashboard and denied anonymous dashboard access.

References: [Prometheus configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/), [Spring Boot Actuator](https://docs.spring.io/spring-boot/3.5/how-to/actuator.html), [Grafana provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/).
