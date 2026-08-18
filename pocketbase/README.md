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
