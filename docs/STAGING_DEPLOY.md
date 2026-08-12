# Remote Staging Deployment

## Purpose

`scripts/deploy-staging-remote.sh` lets an approved local operator or Codex
session start the existing Hostinger staging deployment without opening a VPS
terminal manually. The helper connects over SSH and runs:

```bash
cd /docker/mentorandi && ./scripts/deploy-staging.sh
```

The server-side script remains responsible for updating `origin/main`, building
the Docker service, applying its established deployment flow, and checking the
public staging health endpoint.

## Prerequisites

- The intended runtime changes are committed and pushed to `main`.
- `npm run check:env`, `npm run lint`, `npm run build`, and
  `npm run smoke:alpha` pass before deployment.
- The user has explicitly approved a staging deployment.
- Local SSH authentication for the target VPS is already configured. The
  helper does not contain, create, or copy keys, passwords, environment files,
  or application secrets.

## Run

From the MentorAndI app repository:

```bash
./scripts/deploy-staging-remote.sh
```

Defaults:

```text
STAGING_SSH_TARGET=root@srv1515503.hstgr.cloud
STAGING_REMOTE_APP_DIR=/docker/mentorandi
```

If `STAGING_SSH_IDENTITY_FILE` is unset and `~/.ssh/mentorandi_vps` exists, the
helper selects that existing local identity. It does not copy or print the key.
Override the identity path when needed:

```bash
STAGING_SSH_IDENTITY_FILE=/secure/local/path/to/staging_key \
./scripts/deploy-staging-remote.sh
```

Override values for another authorized staging target or checkout:

```bash
STAGING_SSH_TARGET=deploy@example-staging-host \
STAGING_REMOTE_APP_DIR=/srv/mentorandi \
STAGING_SSH_IDENTITY_FILE=/secure/local/path/to/staging_key \
./scripts/deploy-staging-remote.sh
```

The remote directory must be an absolute path using letters, numbers, dots,
underscores, dashes, and slashes. SSH runs in batch mode and fails instead of
prompting for a password. `StrictHostKeyChecking=accept-new` records a new
server host key in the operator's normal `known_hosts` file on first contact;
SSH still rejects a host whose saved key changes. User authentication remains
the responsibility of the operator's existing SSH configuration.

## Scope And Safety

- This helper deploys staging only; it does not implement a production deploy.
- It does not modify `.env`, `.env.staging`, SSH configuration, or credentials.
- It does not grant standing approval to deploy. Codex may run it only when the
  current user has approved staging deployment and the required checks pass.
- A nonzero SSH or remote deploy exit code makes the local helper fail.
