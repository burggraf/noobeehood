# NooBeehood Technical Stack

**Status:** Initial technical direction  
**Scope:** Website-first foundation; native applications follow after the responsive website is useful  
**Decision date:** 2026-08-14

## Stack commitments

| Area | Decision | Version / policy |
|---|---|---|
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

PocketBase is the backend service for the web and future native clients. Local development will use the pinned **v0.39.11** binary and a project-local data directory. The binary, data, and admin credentials must not be committed.

Local setup is intentionally deferred until the application scaffold is created. The setup should add a documented start command and environment configuration, without replacing or sharing data with any other local or VPS PocketBase application.

Development will have separate local, staging, and production environments. Staging will use `staging.noobeehood.com` and `api-staging.noobeehood.com`; production will use `noobeehood.com` and `api.noobeehood.com`. Each environment must have separate configuration, PocketBase data, OAuth callbacks, email settings, and R2 paths or buckets as appropriate.

Production deployment will use a separate PocketBase process/service, database directory, logs, and domain or subdomain routing. PocketBase backups and file storage will use Cloudflare R2 through its S3-compatible configuration. The shared VPS must be inspected before deployment; no existing service may be stopped, reconfigured, or upgraded as part of this project without an explicit change plan.

## Authentication

Required login methods:

1. Email and password.
2. Google OAuth.
3. Apple OAuth.

Email/password requirements:

- email verification is mandatory before login is accepted;
- multi-factor authentication is mandatory for Beekeepers and PocketBase administrative accounts;
- verification and password-reset email delivery must be configured;
- failed login and verification states must be clear and accessible;
- credentials and OAuth secrets must remain in PocketBase/server-side deployment configuration, never in the client bundle.

OAuth callback URLs must be defined separately for local development, website production, and each native platform. Production Google and Apple OAuth credentials will initially use personal developer accounts and should be migrated to dedicated NooBeehood organization accounts before public native release. Apple Sign In requires an Apple Developer configuration and should be tested on real Apple hardware before native release.

Resend will deliver verification and password-reset messages from `no-reply@noobeehood.com`. Domain authentication records must be added to DNS before production email is enabled.

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

Do not encode authorization as a single role field on the user record if users can belong to multiple hives. Prefer explicit membership records with tenant, user, role, status, and audit fields. Exact collections and permissions remain an implementation design task.

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

- no native Tauri application yet;
- no VPS deployment yet;
- no PocketBase production configuration yet;
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
- local, staging, and production environments are separate, with staging at `staging.noobeehood.com` and `api-staging.noobeehood.com`.

Operational details still to define during implementation include backup encryption and recovery testing, exact OAuth credentials, DNS records for staging, and the native release-account migration.
