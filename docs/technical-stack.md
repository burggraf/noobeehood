# NooBeehood Technical Stack

**Status:** Local website foundation implemented; deployment configuration deferred
**Scope:** Website-first foundation; native applications follow after the responsive website is useful  
**Decision date:** 2026-08-14

## Stack commitments

| Area | Decision | Version / policy |
|---|---|---|
| Developer runtime | Node.js | **20.19.0 or newer** |
| Web UI | Svelte | **5.56.9** |
| Web framework | SvelteKit | **2.70.2**, latest stable release selected; do not use SvelteKit 3 prereleases |
| Backend | PocketBase | **v0.39.11**, latest stable release selected |
| Native shell | Tauri | Tauri 2 line, to be selected and pinned when native work begins |
| Web hosting | Static client application on `noobeehood.com` | Website-first |
| Backend hosting | Self-hosted PocketBase on the shared VPS | Isolated service and data directory required |
| Object storage and backups | Cloudflare R2 via PocketBase's S3-compatible settings | Backups and PocketBase file storage; daily/30-day plus weekly/12-month retention |
| Email delivery | Resend | Sender: `no-reply@noobeehood.com` |
| Environments | Local, staging, and production | Separate site/backend configuration and PocketBase data |
| Source control | Git | Exact dependency versions and lockfiles are committed |

Versions were checked against the official GitHub release endpoints on 2026-08-14:

- [SvelteKit releases](https://github.com/sveltejs/kit/releases/tag/%40sveltejs%2Fkit%402.70.2)
- [Svelte releases](https://github.com/sveltejs/svelte/releases/tag/svelte%405.56.9)
- [PocketBase releases](https://github.com/pocketbase/pocketbase/releases/tag/v0.39.11)

PocketBase is still pre-1.0. Upgrades must be deliberate: review release notes, back up data, test migrations, and pin the deployed binary rather than tracking `latest` automatically.

## Runtime architecture

The first deliverable is a responsive SvelteKit website for:

- desktop and laptop browsers;
- phones;
- tablets.

The same client-side application should eventually be packaged by Tauri for:

- iOS phones and tablets;
- Android phones and tablets;
- macOS desktops and laptops;
- Windows desktops and laptops.

The website is the first platform, not a separate product. Platform-specific features should be isolated behind small adapters only when needed.

### Client-only rule

The application will not use SSR, SvelteKit server routes, form actions, hooks running on the server, or other server-side application code.

Use SvelteKit's static output with a client-only configuration:

- `adapter-static` for the website build;
- `ssr = false` in the root layout or equivalent project configuration;
- browser-side PocketBase SDK calls;
- static hosting with SPA fallback configured by the host.

This rule applies to application code. PocketBase remains the remote backend service and owns persistence, authentication, authorization rules, files, and realtime APIs.

## PocketBase

PocketBase is the backend service for the web and future native clients. Local development uses the pinned **v0.39.11** binary, committed migrations, and a project-local ignored data directory. The binary, data, and superuser credentials are not committed. The implemented collections and exact authorization rules are documented in [Initial data model](data-model.md).

The local installer, isolated serve command, browser-client environment, and authorization security check are implemented and documented below. They do not replace or share data with any other local or VPS PocketBase application.

Development will have separate local, staging, and production environments. Staging will use `staging.noobeehood.com` and `api-staging.noobeehood.com`; production will use `noobeehood.com` and `api.noobeehood.com`. Configuration for both deployed environments remains deferred. Each environment must have separate PocketBase data, OAuth callbacks, email settings, and R2 paths or buckets as appropriate.

Production deployment will use a separate PocketBase process/service, database directory, logs, and domain or subdomain routing. PocketBase backups and file storage will use Cloudflare R2 through its S3-compatible configuration. The shared VPS must be inspected before deployment; no existing service may be stopped, reconfigured, or upgraded as part of this project without an explicit change plan. Production service, R2, and backup configuration are not implemented yet.

## Local developer workflow

Node.js **20.19.0 or newer** is required. From the repository root:

```sh
npm --prefix web ci
./scripts/install-pocketbase.sh
./pocketbase/pocketbase serve \
  --dir=./pocketbase/pb_data \
  --migrationsDir=./pocketbase/pb_migrations \
  --http=127.0.0.1:8090
```

The data directory is ignored; the migration directory is committed. Open <http://127.0.0.1:8090/_/> and create the first local superuser in the dashboard. In another terminal:

```sh
cp web/.env.example web/.env
npm --prefix web run dev
```

`web/.env` is ignored. Run the static validation from the repository root:

```sh
npm --prefix web run check
npm --prefix web run build
test -f web/build/200.html
```

For the authorization check, create a temporary local superuser in the dashboard and pass it only to the test process with safely prompted shell variables:

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

Delete the temporary superuser afterward. The exact success line is `PocketBase security checks passed`. See [Local PocketBase](../pocketbase/README.md) for installer requirements and cleanup guidance.

## Authentication

Email/password signup, mandatory email verification before password login, login, verification resend/confirmation, password reset/confirmation, logout, and account deletion are implemented against local PocketBase. Failed login and verification states are presented in the client. Google OAuth, Apple OAuth, production MFA policy, and deployed mail delivery are still required but explicitly deferred.

OAuth callback URLs must eventually be defined separately for local development, website production, and each native platform. Production Google and Apple OAuth credentials will initially use personal developer accounts and should be migrated to dedicated NooBeehood organization accounts before public native release. Apple Sign In requires an Apple Developer configuration and should be tested on real Apple hardware before native release. OAuth credentials and secrets must remain in PocketBase/deployment configuration, never in the client bundle.

Resend is planned to deliver verification and password-reset messages from `no-reply@noobeehood.com`. Resend and DNS domain-authentication configuration do not exist yet and must be completed before production email is enabled.

### Approved client-only auth residuals

The PocketBase browser SDK's `LocalAuthStore` persists bearer authentication in browser storage. Logout clears that local auth state, but it is not server-side token revocation. This is an accepted residual of the current client-only, no-server-code architecture.

Production must enforce a strong Content Security Policy and allow no untrusted scripts; those deployment protections are requirements, not protections that exist today. Revisit the session architecture only if the threat model requires server-side revocation or HttpOnly sessions, because either would change the current no-server-code decision.

The implemented client sets a `no-referrer` policy and removes verification and password-reset tokens from the visible URL with `history.replaceState` before using them. These measures reduce URL-token exposure but do not alter the browser-storage residual above.

## Multi-tenancy and authorization

Multi-tenancy is a core domain rule, not a UI feature. Every tenant-scoped record must have an explicit tenant/hive relationship, and authorization must be enforced in PocketBase collection rules rather than only in Svelte components.

Initial hierarchy:

```text
Beekeeper
└── Hive / tenant
    ├── Queen — manages a hive and its configuration
    ├── Worker — moderates content within an assigned hive
    └── Member / NooBee — participates according to granted permissions
```

The data model must distinguish:

- global platform administrators from hive-scoped roles;
- a user's membership in one or more hives;
- role assignment and who may change it;
- content ownership, moderation, publication, and audit history;
- invitations, suspension, removal, and transfer of responsibility.

Authorization is not encoded as a single role field on the user record. The initial `users`, `hives`, and explicit `memberships` collections and their PocketBase rules are implemented in a committed migration; see [Initial data model](data-model.md). Queen/Worker management beyond the current Beekeeper-only mutation rules remains a later authorization task.

## Responsive and accessibility baseline

The website will be designed mobile-first and must remain usable at phone, tablet, laptop, and desktop widths. Requirements include:

- keyboard navigation;
- visible focus states;
- semantic HTML and accessible names;
- readable contrast and touch targets;
- reduced-motion support;
- layouts that do not depend on hover;
- usable loading, empty, offline, and error states;
- localization-ready text and date/number formatting.

The first responsive pass should be verified on representative iOS Safari, Android Chrome, desktop Chromium, Firefox, and Safari environments. The support baseline is the latest two versions of Chrome, Safari, Firefox, and Edge, including iOS Safari and Android Chrome. Future native apps will target the current and previous major OS versions for iOS, Android, macOS, and Windows at each release.

## Deployment direction

The planned production shape is:

```text
Browser / Tauri client
        │ HTTPS
        ├── Static SvelteKit site: noobeehood.com
        └── PocketBase API: dedicated protected endpoint/service
```

Before deployment, inspect the VPS for existing PocketBase installations, reverse-proxy configuration, service managers, firewall rules, backups, and resource limits. This is a shared system, so this application must have isolated paths, a unique service name, unique ports where applicable, and a scoped reverse-proxy configuration. Deployment must include rollback and backup steps.

## Explicit non-goals for this phase

- no native Tauri application or native configuration yet;
- no VPS, staging, or production deployment yet;
- no staging or production PocketBase configuration yet;
- no Google or Apple OAuth configuration yet;
- no Resend or Cloudflare R2 deployment configuration yet;
- no server-side SvelteKit code;
- no automatic dependency or PocketBase upgrades;
- no premature abstraction for platform-specific APIs.

## Decisions still needed

The major stack decisions are now resolved:

- tenants are geographic hives for now; organizations/private groups may be added later;
- roles are hive-scoped, while Beekeeper is a global platform-admin role;
- discovery content is public; accounts are required to contribute, save, ask, or moderate;
- registration is open;
- Google and Apple OAuth initially use personal developer accounts;
- Resend sends from `no-reply@noobeehood.com`;
- PocketBase uses proxied `api.noobeehood.com`;
- Cloudflare R2 stores files and backups, with daily 30-day and weekly 12-month retention;
- the website supports the latest two versions of major browsers; native apps target current and previous major OS versions;
- native distribution starts with personal developer accounts and later migrates to organization accounts;
- users can delete accounts, with contributed content anonymized or retained as community content where appropriate;
- local, staging, and production environments are separate, with staging at `staging.noobeehood.com` and `api-staging.noobeehood.com`; both staging DNS A records point to the shared VPS and are Cloudflare-proxied.

Operational details still to define during implementation include backup encryption and recovery testing, exact OAuth credentials, and the native release-account migration.
