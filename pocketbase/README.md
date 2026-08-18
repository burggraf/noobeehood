# Local PocketBase

This repository uses PocketBase v0.39.11 for local development. The binary is
installed locally and is intentionally not committed.

## Install

From the repository root:

```sh
./scripts/install-pocketbase.sh
./pocketbase/pocketbase --version
```

The installer selects the Darwin or Linux amd64/arm64 release, verifies its
SHA-256 checksum, and installs only the `pocketbase` executable. It requires a
POSIX shell plus `curl`, `mktemp`, `rm`, `shasum`, `uname`, and `unzip`. Linux
systems must provide `shasum` (usually from the Perl package); the installer
does not silently substitute an unverified checksum tool.

## Serve locally

Keep local data and migrations isolated under `pocketbase/`:

```sh
./pocketbase/pocketbase serve \
  --dir=./pocketbase/pb_data \
  --migrationsDir=./pocketbase/pb_migrations \
  --http=127.0.0.1:8090
```

Open <http://127.0.0.1:8090/_/> to create the first local superuser
interactively. Do not commit the credentials.

## Run the security check

With PocketBase running locally and a temporary local superuser available, run
from `web/` with the values supplied only in your shell environment:

```sh
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090 \
PB_SUPERUSER_EMAIL='local-superuser@example.test' \
PB_SUPERUSER_PASSWORD='use-your-local-password' \
npm run test:pocketbase
```

Use only local, temporary credentials. The check creates and removes a unique
test user; it does not print credentials or tokens. Do not put these values in
committed files or shared logs.
