# NooBeehood

**NooBeehood** is the app for finding your footing, your people, and your place in a new community.

The brand centers on the **NooBee**: someone exploring, arriving, settling in, or helping others feel at home. Local communities are organized as **hives**, and useful contributions help build the hive.

> **Your new neighborhood.**

The first hive is **Manta + Manabí, Ecuador**.

## Product idea

NooBeehood turns repeated questions from Facebook groups, YouTube viewers, residents, and newcomers into useful local resources that are easier to find and keep current.

The initial experience focuses on:

- finding products, places, professionals, services, and events;
- practical relocation and settling-in guides;
- housing and household help;
- transportation, travel, and local experiences;
- requests, corrections, and community contributions;
- connections to existing Facebook, YouTube, and in-person communities.

## Brand model

```text
NooBeehood
└── Manta + Manabí Hive
    ├── Discover
    ├── Homes
    ├── Guides
    ├── Events
    └── Community
```

Future places become additional hives only after the first hive is genuinely useful.

## Local development

Requirements: Node.js **20.19.0 or newer** and the POSIX command-line tools listed in [pocketbase/README.md](pocketbase/README.md).

From the repository root:

```sh
npm --prefix web ci
./scripts/install-pocketbase.sh
```

Start the pinned PocketBase **v0.39.11** binary in one terminal. These explicit paths keep NooBeehood data and committed migrations isolated from other PocketBase projects:

```sh
./pocketbase/pocketbase serve \
  --dir=./pocketbase/pb_data \
  --migrationsDir=./pocketbase/pb_migrations \
  --http=127.0.0.1:8090
```

Open <http://127.0.0.1:8090/_/> and create the first local superuser in the dashboard. Use local-only credentials and do not commit them. Then configure and start the web client in another terminal:

```sh
cp web/.env.example web/.env
npm --prefix web run dev
```

`web/.env` is ignored by Git and points the browser client to the isolated local PocketBase instance. Visit the URL printed by Vite.

Run the static checks from the repository root:

```sh
npm --prefix web run check
npm --prefix web run build
test -f web/build/200.html
```

For the PocketBase authorization check, create a temporary local superuser in the dashboard, then use a hidden password prompt rather than putting credentials in shell history or a file:

```bash
read -r -p 'Temporary PocketBase superuser email: ' PB_SUPERUSER_EMAIL
read -r -s -p 'Temporary PocketBase superuser password: ' PB_SUPERUSER_PASSWORD
printf '\n'
PUBLIC_POCKETBASE_URL='http://127.0.0.1:8090' \
  PB_SUPERUSER_EMAIL="$PB_SUPERUSER_EMAIL" \
  PB_SUPERUSER_PASSWORD="$PB_SUPERUSER_PASSWORD" \
  npm --prefix web run test:pocketbase
unset PB_SUPERUSER_EMAIL PB_SUPERUSER_PASSWORD
```

Delete that temporary superuser in the local dashboard afterward. The check creates and removes its own test users and prints `PocketBase security checks passed` on success.

## Documentation

- [Brand foundation](docs/brand-foundation.md)
- [Product foundation](docs/product-foundation.md)
- [Content and category map](docs/content-taxonomy.md)
- [Technical stack](docs/technical-stack.md)
- [Initial data model and authorization rules](docs/data-model.md)
- [Website foundation implementation plan](docs/plans/2026-08-18-website-foundation-implementation.md)
- [Manta + Manabí seed listing candidates](docs/research/manta-manabi-seed-listing-candidates.md)

## Status

The local website, PocketBase schema, email/password authentication flows, and authorization security check are implemented. OAuth, Tauri, staging and production deployment, Cloudflare R2, and Resend deployment configuration remain explicitly deferred.
