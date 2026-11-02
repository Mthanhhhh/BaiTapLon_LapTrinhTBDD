# Security verification — 2026-11-03

The independent service deployment is the target of this verification. Existing account password hashes are not migrated or re-encoded.

## Verified locally

- 44 HTTP/database security checks passed on an isolated clone: three existing-account logins and profiles; access/refresh separation; rotating refresh and replay-family revocation; buyer/admin authorization; QR browser proof, authenticated approval and one-time delivery; reset responses without OTP disclosure; invalid OTP; pagination/sort limits; hidden internal/docs/actuator routes; foreign-order denial; original password fingerprints unchanged; legacy short-password login; five failed logins and persistent temporary lock; new short-password rejection; append-only audit grants; reset rate limit.
- All 414 original stored password fingerprints matched the pre-change baseline on the clone.
- TypeScript typecheck passed. Mobile tests: 3 passed. ESLint: 0 errors, 81 existing warnings. Expo web export passed.
- npm audit: 0 critical/high/moderate; 7 low-severity findings remain in the dependency tree (deepmerge-related upstream packages).
- Gitleaks full history (27 pre-change commits): no leaks after narrow allow-lists for public catalog SHA-256 identifiers and a deterministic WebSocket test nonce. No global secret-rule suppression.
- ZAP passive baseline against the built frontend behind Nginx: 0 FAIL, 62 PASS, 6 WARN groups in the baseline summary. JSON additionally lists informational/alpha alerts. Review CSP broad HTTPS sources and inline styles (Expo/maps/images), opener/embedder/resource isolation compatibility, timestamp disclosure and bundled JavaScript warnings. This is not an authenticated penetration test.
- Initial Trivy scan found fixable vulnerabilities in Jackson, Netty, Tomcat, Kafka compression libraries and Log4j. Compatible patch versions are pinned in all active service POMs.

## Scoped advisory exceptions

Two Spring 6.2 advisories have no patch on that line at verification time: CVE-2026-47884 (XsltView with implicit view rendering) and CVE-2026-47890 (SSE view fragments). The application uses REST controllers and WebSocket and has none of these view/SSE APIs. `.trivyignore.yaml` records these two conditional exceptions, expiring 2026-12-03. Re-review whenever adding MVC views/SSE or upgrading Spring; do not suppress all Spring advisories.

## Reproduce / operate

1. `python scripts/check-service-boundaries.py` and Maven `verify` for each active service. Backend Docker builds also run tests.
2. In `apps/mobile`: `npm ci`, `npx tsc --noEmit`, `npm run lint`, `node --test tests/*.test.mjs`, `npm audit --audit-level=moderate`.
3. CI runs gitleaks, Trivy container scans and a ZAP passive scan; reports are retained as workflow artifacts. Production CD is triggered only after the CI workflow succeeds. The self-hosted runner must be online for automatic CD.
4. Production deployment script backs up all four databases before additive migrations and uses versioned images with rollback. Build steps are sequential to bound RAM use.
5. Check `/actuator/health`, CORS/WS, existing-account login, database counts and pre/post password fingerprints after deployment. Keep private test credentials and raw scanner artifacts in ignored `.tools/security`, never commit tokens/credentials.

SMTP and a payment merchant account are external configuration prerequisites. No real email delivery or card charge is claimed. See [threat model](SECURITY_THREAT_MODEL.md) for operating limits.
