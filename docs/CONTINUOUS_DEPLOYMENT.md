# G4 — GitHub Actions deployment to the personal server

## Flow

1. Push to `main` starts CI: backend tests, frontend checks, monitoring rule tests and security scans.
2. Successful CI triggers `Deploy personal server`.
3. A GitHub-hosted preflight confirms that the commit is still the current `main` SHA and that CI passed for that exact SHA. Manual deployment also requires this gate.
4. Only then does the trusted Windows runner receive the deployment job. It checks again for a superseded commit after waiting in the queue.
5. The server builds six images sequentially, backs up all four databases, applies unapplied migrations, starts the containers and refreshes config bind mounts.
6. Local health, public HTTPS/catalog and live monitoring must pass before `current.json` is updated.
7. If deployment verification fails, restore previous application images and check the application again. Additive migrations remain; automatic DB restore would discard newer transactions.

GitHub concurrency and an exclusive file lock prevent overlapping deployments. PR and branch CI never deploy to the personal runner. No production credentials or database dumps are uploaded as artifacts. Workflow summaries contain only the release/state metadata, not environment contents.

## Required processes on this machine

- Docker Desktop running and ready.
- Cloudflared running for public HTTPS.
- GitHub runner `eshop-personal-server` online, labels `self-hosted`, `Windows`, `X64`, `eshop-server`.
- Private environment at `T:/ProjectTBDD/.env.independent.local`.
- Windows must remain awake and connected to the Internet.

The runner has been registered under `.tools/github-runner`. Start it in PowerShell and keep that window open:

```powershell
& 'T:\ProjectTBDD\.tools\github-runner\run.cmd'
```

Wait for **Listening for Jobs**. Closing the runner stops automatic deployment but does not stop already running application containers. Automatic runner startup after Windows reboot is not configured; this guide deliberately uses the existing foreground runner.

## Manual retry

In GitHub Actions, first run **CI** on `main` if that exact commit has no successful CI (for example a documentation commit with `[skip ci]`). Then run **Deploy personal server** on `main`. The manual button does not bypass CI.

For a local operator deployment of a clean, trusted checkout:

```powershell
./scripts/deploy-independent.ps1 -EnvironmentFile T:/ProjectTBDD/.env.independent.local
```

The script requires a clean tracked checkout, validates the expected SHA in CI, and retains previous images/database volumes. State and attempts are in `T:/ProjectTBDD/.tools/deployment`; backups are in `.tools/backups`. Do not remove these while a job is running.

## Interpreting the result

- CI green means build/tests/scans passed; it does not by itself prove deployment.
- Deploy green plus a matching `current.json` SHA means server deployment verification passed.
- Queued deployment usually means the runner is offline or another deployment holds the concurrency slot.
- A failed deploy can leave the prior release running after rollback; inspect `last-attempt.json` and the workflow log.
- A failure before container replacement (build/backup/migration) stops deployment. There is no need to replace healthy prior images in that case.
- The server is still one personal machine; this does not provide cloud-provider uptime or host-level HA.
