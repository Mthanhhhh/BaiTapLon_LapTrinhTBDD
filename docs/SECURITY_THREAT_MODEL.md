# Security model and operating boundaries

Scope: independently deployed Auth, Product, Order and Payment services behind the Gateway/Nginx and Cloudflare Tunnel. Database, Redis, Kafka and Elasticsearch ports are private to Docker. Browser/mobile traffic crosses the public HTTPS boundary; service calls cross a separate authenticated internal boundary. Database root credentials are restricted to migration/backup operations.

## STRIDE

| Threat | Controls | Verification |
|---|---|---|
| Spoofing | BCrypt compatibility, purpose-bound signed JWTs, active-account/version checks, OAuth provider verification, authenticated QR approval | Existing logins, access/refresh confusion and QR proof tests |
| Tampering | Server-side prices/inventory, input/body/page/sort bounds, owner checks, command inbox idempotency | IDOR, invalid parameters, stock concurrency and replay tests |
| Repudiation | Request IDs, per-domain write audit, authentication/session audit; app DB users cannot update/delete audit | Audit write and denied DELETE test |
| Information disclosure | Generic login/reset responses, no OTP response, hashed refresh tokens, redacted errors, no card PAN/CVV intake, secret scanning | Unknown account/reset parity, malformed requests, gitleaks |
| Denial of service | Redis/Gateway/Nginx rate limits, account lock, bounded JSON and body sizes, timeouts, Redis memory bound | 429 and five-failure lock tests; load report |
| Elevation of privilege | ADMIN routes, live account status/version checks, shop ownership checks, internal service token and ingress deny | Buyer/admin and foreign-order tests |

## OWASP Top 10 (2025) mapping

| Category | Implementation / remaining boundary |
|---|---|
| A01 Broken Access Control | RBAC, current user ownership, private internal routes, CORS allow-list |
| A02 Security Misconfiguration | Required secrets, hidden debug/docs endpoints, health-only actuator, security headers, least-privilege DB grants |
| A03 Software Supply Chain Failures | Lockfile, Maven build verification, npm audit, Trivy and gitleaks CI jobs; review scanner reports and update base images regularly |
| A04 Cryptographic Failures | Existing BCrypt hashes retained; HTTPS; signing secret decoded from required Base64 environment value, >=32 bytes; no raw refresh-token storage |
| A05 Injection | Parameterized SQL/JPA, sort whitelist, bounded JSON; no arbitrary client-supplied SQL |
| A06 Insecure Design | OTP attempt/expiry limits, one-time QR proof, token family replay revocation, server-side totals, transactional order compensation |
| A07 Authentication Failures | Five-failure lock, rate limits, access/refresh separation, rotating refresh sessions, version-based global revocation |
| A08 Software or Data Integrity Failures | Inbox deduplication/outbox, restricted Redis polymorphic deserialization, Kafka headers not trusted for Java types |
| A09 Security Logging and Alerting Failures | Append-only application audit and request IDs; operator must monitor logs and retain backups; external paging/SIEM is not configured |
| A10 Mishandling of Exceptional Conditions | Generic structured errors, fail-closed identity/internal authorization, challenge rate limiter fails closed when Redis is unavailable |

## Compatibility and explicit limits

- No migration changes existing password hashes. New-password rules apply only to registration and a user-authorized reset. Ordinary login accepts pre-existing short passwords.
- `SECURITY_LEGACY_TOKEN_UNTIL` is a temporary Unix timestamp for a rolling upgrade. Default 0 rejects legacy JWTs; remove/expire the override after migration. Existing credentials remain usable after it expires.
- Refresh-family revocation stops refresh immediately. Existing access tokens expire within 15 minutes; logout-all/password reset increments security version and rejects them immediately.
- Password-reset email requires `SMTP_ENABLED=true` plus verified SMTP credentials. Disabled/unavailable SMTP returns a generic accepted response without pretending to send an OTP. Do not expose SMTP secrets through public environment variables.
- QR backend is secured; the previous simulated QR login has been disabled until a real scanner/pairing UI is supplied.
- Payment is not a bank gateway. No merchant credentials exist, so live card charging remains unavailable. COD does not require storing card data.
- Browser token storage remains localStorage under the existing design. CSP reduces exposure but does not make it equivalent to an HttpOnly cookie; native uses SecureStore.
- HTTPS is terminated by Cloudflare. Local Docker network traffic is private but not service-mesh mTLS. Existing password encryption is deliberately unchanged.
- CI Trivy gates fixable HIGH/CRITICAL findings; unfixed findings remain in scanner output. npm gates moderate and above. ZAP baseline is passive: warnings are retained for review, not evidence of a penetration test.

References: [OWASP 2025](https://top10.owasp.org/2025/0x00_2025-Introduction/), [Microsoft STRIDE](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats).
