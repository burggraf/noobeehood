# Local PocketBase

This is the canonical local setup and verification guide. The repository uses PocketBase **v0.39.11**, pinned in `VERSION`; the installed binary, local data, and credentials are intentionally not committed. The committed migrations implement the schema documented in [Initial data model](../docs/data-model.md).

## Platform support

The installer and local shell workflow documented here support **macOS and Linux only**, on amd64/x86_64 or arm64 hardware. Windows developers should use Windows Subsystem for Linux (WSL) for this documented workflow or manually download the matching PocketBase **v0.39.11** Windows binary from the [official release](https://github.com/pocketbase/pocketbase/releases/tag/v0.39.11), verify it against the published checksum, and adapt the executable path for their native shell. This repository does not provide or claim a tested native Windows installer script.

## Complete local workflow

Node.js **20.19.0 or newer** and pnpm **10.34.5** are required for the web client. The version is pinned in `web/package.json`; Corepack-compatible pnpm installations select it automatically. From the repository root on macOS, Linux, or WSL, install the exact locked dependencies and pinned PocketBase binary:

```sh
corepack enable
pnpm --dir web --version # 10.34.5
pnpm --dir web install --frozen-lockfile
./scripts/install-pocketbase.sh
./pocketbase/pocketbase --version
```

The PocketBase installer selects the Darwin or Linux amd64/arm64 release, verifies its SHA-256 checksum, and installs only the `pocketbase` executable. It requires a POSIX shell plus `curl`, `mktemp`, `rm`, `shasum`, `uname`, and `unzip`. Linux systems must provide `shasum` (usually from the Perl package); the installer does not silently substitute an unverified checksum tool.

Start PocketBase from the repository root in its own terminal:

```sh
./pocketbase/pocketbase serve \
  --dir=./pocketbase/pb_data \
  --migrationsDir=./pocketbase/pb_migrations \
  --http=127.0.0.1:8090
```

The explicit data and migration paths isolate NooBeehood from every other local or deployed PocketBase application. Open <http://127.0.0.1:8090/_/> and create the first local superuser interactively in the dashboard. Use local-only credentials and do not commit them.

In a second terminal, create the web environment file and start Vite:

```sh
cp web/.env.example web/.env
pnpm --dir web run dev
```

`web/.env` is ignored by Git and points the browser client to this isolated local PocketBase service. After this initial setup, `./dev.sh` starts both services and stops those it started when you press Ctrl+C.

Run the type/static check and production build from the repository root:

```sh
pnpm --dir web run check
pnpm --dir web run build
test -f web/build/200.html
```

## Validate and import verified listings

Run the stdlib-only prevalidation before importing. It checks the allowlist, required fields, lengths, URLs, ISO dates, slugs, duplicates, and six documented search cases:

```sh
pnpm --dir web run check:seeds
```

With a local PocketBase superuser, import is idempotent: matching `(hive, slug)` records are updated and absent records are created. It fully validates before authenticating and never prints credentials or tokens:

```sh
PUBLIC_POCKETBASE_URL='http://127.0.0.1:8090' PB_SUPERUSER_EMAIL="$PB_SUPERUSER_EMAIL" PB_SUPERUSER_PASSWORD="$PB_SUPERUSER_PASSWORD" pnpm --dir web run seed:listings
```

Run it twice to confirm the second run reports updates and creates no duplicates. Charter Manta intentionally has no phone, email, or boarding location pending conflict resolution; unsupported search cases return no results.

## Run the authorization security check

With the isolated PocketBase instance running, create a temporary local superuser in the dashboard. Run the following in Bash and prompt for its credentials so the password is not saved in shell history, an environment file, or a shared log:

```bash
read -r -p 'Temporary PocketBase superuser email: ' PB_SUPERUSER_EMAIL
read -r -s -p 'Temporary PocketBase superuser password: ' PB_SUPERUSER_PASSWORD
printf '\n'
PUBLIC_POCKETBASE_URL='http://127.0.0.1:8090' \
  PB_SUPERUSER_EMAIL="$PB_SUPERUSER_EMAIL" \
  PB_SUPERUSER_PASSWORD="$PB_SUPERUSER_PASSWORD" \
  pnpm --dir web run test:pocketbase
unset PB_SUPERUSER_EMAIL PB_SUPERUSER_PASSWORD
```

The check reads only temporary process environment, creates and removes unique test users, and does not print credentials or tokens. Success is exactly:

```text
PocketBase security checks passed
```

Delete the temporary superuser from the local dashboard after the check. Never use staging or production credentials for this test.

OAuth, staging and production PocketBase services, Resend email delivery, Cloudflare R2 storage/backups, and Tauri/native configuration are not part of this local setup and remain deferred.
