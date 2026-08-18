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
SHA-256 checksum, and installs only the `pocketbase` executable.

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

Alternatively, create one with the v0.39.11 CLI. Enter the values locally so
they are not stored in this repository:

```sh
printf 'Email: '
IFS= read -r SUPERUSER_EMAIL
printf 'Password: '
IFS= read -r SUPERUSER_PASSWORD
./pocketbase/pocketbase superuser create \
  "$SUPERUSER_EMAIL" "$SUPERUSER_PASSWORD" \
  --dir=./pocketbase/pb_data
unset SUPERUSER_EMAIL SUPERUSER_PASSWORD
```

The `serve --dir`, `serve --migrationsDir`, `serve --http`, and global
`superuser create --dir` flags are supported by PocketBase v0.39.11. The
`superuser create` email and password are positional arguments.
