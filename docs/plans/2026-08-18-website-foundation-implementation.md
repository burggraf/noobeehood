# Website Foundation Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Build a pinned, client-only SvelteKit website connected to a local PocketBase instance, with a responsive branded shell, public hive data, and verified email/password authentication.

**Architecture:** Keep the web application in `web/` and the standalone PocketBase runtime in `pocketbase/`. SvelteKit builds a static SPA and talks directly to PocketBase through its browser SDK; PocketBase collection rules are the security boundary. Commit PocketBase migrations but never the binary, credentials, or `pb_data`.

**Tech Stack:** Svelte 5.56.9, SvelteKit 2.70.2, adapter-static, TypeScript, PocketBase v0.39.11, PocketBase JavaScript SDK 0.27.3, pnpm 10.34.5.

---

## Scope and guardrails

This plan deliberately delivers one thin website-first slice:

- responsive public homepage;
- active hives loaded from PocketBase;
- signup, verification, login, logout, password reset, and account deletion;
- the initial `users`, `hives`, and `memberships` schema;
- repeatable local setup and security checks.

Not in this plan:

- Google or Apple OAuth;
- Tauri/native packaging;
- staging or production deployment;
- listings, guides, events, search, moderation UI, or content authoring;
- Queen/Worker management UI;
- Cloudflare R2 or Resend production credentials.

The schema records Queen and Worker roles now, but the first migration allows only Beekeepers to manage hives and memberships. This conservative rule avoids shipping an untested cross-tenant privilege path. Hive-scoped management rules are added only with dedicated authorization tests in the next slice.

## Task 1: Scaffold the pinned client-only web app

**Files:**
- Create: `web/` using the Svelte CLI
- Create: `web/.npmrc`
- Modify: `web/package.json`
- Modify: `web/svelte.config.js`
- Create: `web/src/routes/+layout.ts`
- Modify: `.gitignore`

**Step 1: Scaffold the minimal TypeScript project**

Run:

```bash
pnpm dlx sv create web --template minimal --types ts --no-add-ons --install pnpm
```

Expected: a runnable SvelteKit project under `web/`.

**Step 2: Pin direct dependencies**

Create `web/.npmrc`:

```ini
save-exact=true
```

Run from the repository root:

```bash
pnpm --dir web add --save-exact pocketbase@0.27.3
pnpm --dir web add --save-dev --save-exact svelte@5.56.9 @sveltejs/kit@2.70.2 @sveltejs/adapter-static@3.0.10
```

Keep the Svelte CLI's generated TypeScript, Vite, Svelte plugin, and `svelte-check` versions, but remove `^` or `~` from every direct dependency in `package.json`. Commit `web/pnpm-lock.yaml`.

**Step 3: Configure the static SPA**

Set `web/svelte.config.js` to use the static adapter with a fallback:

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ fallback: '200.html' })
	}
};

export default config;
```

Create `web/src/routes/+layout.ts`:

```ts
export const ssr = false;
```

Do not create `+server.ts`, `+page.server.ts`, or `hooks.server.ts` files.

**Step 4: Extend ignores**

Add:

```gitignore
web/node_modules/
web/.svelte-kit/
web/build/
web/.env
web/.env.*
!web/.env.example
pocketbase/pocketbase
pocketbase/pocketbase.exe
pocketbase/pb_data/
```

**Step 5: Verify the empty scaffold**

Run:

```bash
pnpm --dir web run check
pnpm --dir web run build
find web/build -name 200.html
```

Expected: checks and build pass, and `web/build/200.html` exists.

**Step 6: Commit**

```bash
git add .gitignore web
git commit -m "feat: scaffold client-only SvelteKit app"
```

## Task 2: Install pinned PocketBase locally

**Files:**
- Create: `pocketbase/VERSION`
- Create: `scripts/install-pocketbase.sh`
- Create: `pocketbase/README.md`

**Step 1: Record the version**

Create `pocketbase/VERSION` containing exactly:

```text
0.39.11
```

**Step 2: Add the installer**

Create `scripts/install-pocketbase.sh` as a small POSIX shell script that:

1. reads `pocketbase/VERSION`;
2. maps `uname -s` to `darwin` or `linux`;
3. maps `uname -m` to `amd64` or `arm64`;
4. downloads the matching release zip and `checksums.txt` from GitHub;
5. verifies the zip with `shasum -a 256`;
6. extracts only the executable to `pocketbase/pocketbase`;
7. runs `pocketbase/pocketbase --version`.

Fail on unsupported systems rather than guessing. Use only `curl`, `shasum`, `unzip`, and shell built-ins; add no package dependency.

**Step 3: Run the installer**

```bash
chmod +x scripts/install-pocketbase.sh
./scripts/install-pocketbase.sh
./pocketbase/pocketbase --version
```

Expected: output identifies PocketBase `0.39.11`; the executable remains ignored by Git.

**Step 4: Document local commands**

`pocketbase/README.md` must document:

```bash
./scripts/install-pocketbase.sh
./pocketbase/pocketbase serve \
  --dir=./pocketbase/pb_data \
  --migrationsDir=./pocketbase/pb_migrations \
  --http=127.0.0.1:8090
```

Also document creating a local superuser interactively or with the PocketBase `superuser create` command. Never place its credentials in a committed command example.

**Step 5: Commit**

```bash
git add pocketbase/VERSION pocketbase/README.md scripts/install-pocketbase.sh
git commit -m "chore: add pinned PocketBase installer"
```

## Task 3: Define the initial multi-tenant schema

**Files:**
- Create: `pocketbase/pb_migrations/<timestamp>_initial_schema.js`
- Create: `docs/data-model.md`

**Step 1: Create a migration**

Run:

```bash
./pocketbase/pocketbase migrate create initial_schema \
  --dir=./pocketbase/pb_data \
  --migrationsDir=./pocketbase/pb_migrations
```

**Step 2: Implement the schema**

The migration must create these collections in dependency order:

### `users` auth collection

| Field | Type | Rules |
|---|---|---|
| `name` | text | required, max 120 |
| `is_beekeeper` | bool | default false, not client-assignable |

Configuration:

```text
authRule: verified = true
passwordAuth: enabled; identity field email
list/view: id = @request.auth.id || @request.auth.is_beekeeper = true
create: @request.body.is_beekeeper:isset = false
update: id = @request.auth.id && @request.body.is_beekeeper:isset = false
delete: id = @request.auth.id
manage: @request.auth.is_beekeeper = true
```

The `authRule` is the backend enforcement that prevents unverified password login. The UI message is not the security control.

### `hives` base collection

| Field | Type | Rules |
|---|---|---|
| `name` | text | required, max 120 |
| `slug` | text | required, max 120, unique index |
| `status` | select | one of `active`, `inactive` |

Rules:

```text
list/view: status = "active" || @request.auth.is_beekeeper = true
create/update/delete: @request.auth.is_beekeeper = true
```

Seed one active record:

```text
name: Manta + Manabí
slug: manta-manabi
status: active
```

### `memberships` base collection

| Field | Type | Rules |
|---|---|---|
| `hive` | relation → hives | required, one |
| `user` | relation → users | required, one, cascade delete |
| `role` | select | `queen`, `worker`, or `member` |
| `status` | select | `active`, `invited`, or `suspended` |

Add a unique composite index on `(hive, user)`.

Rules for this first slice:

```text
list/view: user = @request.auth.id || @request.auth.is_beekeeper = true
create/update/delete: @request.auth.is_beekeeper = true
```

**Step 3: Add a reversible down migration**

Delete in reverse dependency order: `memberships`, `hives`, `users`.

**Step 4: Apply the migration to an empty local data directory**

Run:

```bash
rm -rf /tmp/noobeehood-pb-check
./pocketbase/pocketbase migrate up \
  --dir=/tmp/noobeehood-pb-check \
  --migrationsDir=./pocketbase/pb_migrations
```

Expected: migration succeeds with no existing state.

**Step 5: Document the model**

Create `docs/data-model.md` with the three collections, role meanings, API rules, and the rule that all future hive-scoped records must contain a required `hive` relation.

**Step 6: Commit**

```bash
git add pocketbase/pb_migrations docs/data-model.md
git commit -m "feat: define initial PocketBase schema"
```

## Task 4: Add repeatable PocketBase security checks

**Files:**
- Create: `scripts/check-pocketbase.mjs`
- Modify: `pocketbase/README.md`
- Modify: `web/package.json`

**Step 1: Write the failing integration check**

Create a Node script using the installed `pocketbase` SDK. It reads only:

```text
PUBLIC_POCKETBASE_URL
PB_SUPERUSER_EMAIL
PB_SUPERUSER_PASSWORD
```

Use a unique timestamped email and `node:assert/strict`. Check, in order:

1. unauthenticated users can read the active Manta + Manabí hive;
2. public registration succeeds without `is_beekeeper`;
3. registration attempting `is_beekeeper: true` fails;
4. password login fails while the user is unverified;
5. a superuser can mark the test user verified;
6. password login then succeeds;
7. the authenticated user cannot change `is_beekeeper`;
8. the authenticated user can delete their own account.

Always clean up test records in `finally` when they still exist. Never print tokens or passwords.

**Step 2: Run it before the migration is available**

With PocketBase running, run:

```bash
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090 \
PB_SUPERUSER_EMAIL='local value' \
PB_SUPERUSER_PASSWORD='local value' \
node scripts/check-pocketbase.mjs
```

Expected before Task 3 is applied to the running data: FAIL because required collections/rules are absent.

**Step 3: Apply migrations and rerun**

Restart PocketBase against a clean local `pb_data`, create a local superuser, then run the same check.

Expected final line:

```text
PocketBase security checks passed
```

**Step 4: Add a convenience pnpm script**

Add to `web/package.json`:

```json
"test:pocketbase": "node ../scripts/check-pocketbase.mjs"
```

**Step 5: Commit**

```bash
git add scripts/check-pocketbase.mjs pocketbase/README.md web/package.json web/pnpm-lock.yaml
git commit -m "test: verify PocketBase auth rules"
```

## Task 5: Configure the browser PocketBase client

**Files:**
- Create: `web/.env.example`
- Create: `web/src/lib/pocketbase.ts`
- Create: `web/src/lib/auth.svelte.ts`
- Create: `web/src/lib/types.ts`

**Step 1: Define the public environment variable**

Create `web/.env.example`:

```dotenv
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

Copy it locally to `.env`. No secrets belong in any `PUBLIC_` value.

**Step 2: Create one browser client**

`web/src/lib/pocketbase.ts`:

```ts
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import PocketBase from 'pocketbase';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
```

**Step 3: Expose minimal auth state**

`web/src/lib/auth.svelte.ts` should export one `$state` object containing the current user record and subscribe once to `pb.authStore.onChange`. Export a `logout()` function that clears `pb.authStore`. Do not build a repository layer or generic API abstraction.

**Step 4: Add only domain types used now**

`web/src/lib/types.ts` should define `Hive`, `User`, `MembershipRole`, and `MembershipStatus`. Do not mirror every PocketBase system field.

**Step 5: Verify**

```bash
pnpm --dir web run check
pnpm --dir web run build
```

Expected: both pass.

**Step 6: Commit**

```bash
git add web/.env.example web/src/lib web/package.json web/pnpm-lock.yaml
git commit -m "feat: connect web client to PocketBase"
```

## Task 6: Build the responsive branded public shell

**Files:**
- Create: `web/static/brand/` with selected production assets
- Create: `web/src/app.css`
- Create: `web/src/routes/+layout.svelte`
- Modify: `web/src/routes/+page.svelte`

**Step 1: Copy only assets used by the first page**

Copy:

- horizontal full-color logo;
- app icon SVG;
- Nunito Sans Medium and Bold fonts;
- their license.

Do not copy previews, unused logo variants, or splash graphics.

**Step 2: Add global styles**

Use the existing brand values from `assets/brand/tokens.css`. Define local `@font-face` rules, focus styles, a mobile-first content width, and reduced-motion handling. Use CSS only; add no component or styling dependency.

**Step 3: Create the root layout**

The layout contains:

- semantic header and navigation;
- NooBeehood logo;
- main landmark;
- login/account action based on auth state;
- footer.

Navigation must work without hover and collapse naturally on narrow screens without a JavaScript menu in this first slice.

**Step 4: Create the homepage**

On mount, load active hives from `pb.collection('hives')`. Render explicit loading, error, empty, and success states. The Manta + Manabí card links nowhere until a hive route exists; use a button only if it performs an action.

Copy direction:

```text
Your new neighborhood.
Find your footing, your people, and your place in a new community.
```

Provide clear links to create an account and log in.

**Step 5: Verify responsive accessibility manually**

Run:

```bash
pnpm --dir web run dev -- --host 127.0.0.1
```

Check at 375px, 768px, and 1280px widths:

- no horizontal overflow;
- keyboard reaches every control;
- focus is visible;
- no action depends on hover;
- loading/error/empty text is readable;
- logo is not below its documented minimum size.

**Step 6: Verify build and commit**

```bash
pnpm --dir web run check
pnpm --dir web run build
git add web
git commit -m "feat: add responsive public website shell"
```

## Task 7: Implement verified email/password authentication

**Files:**
- Create: `web/src/lib/auth.ts`
- Create: `web/src/routes/signup/+page.svelte`
- Create: `web/src/routes/verify/+page.svelte`
- Create: `web/src/routes/login/+page.svelte`
- Create: `web/src/routes/forgot-password/+page.svelte`
- Create: `web/src/routes/reset-password/+page.svelte`
- Create: `web/src/routes/account/+page.svelte`

**Step 1: Add minimal auth operations**

`web/src/lib/auth.ts` exports focused functions only:

- `signup(name, email, password, passwordConfirm)` creates the user and calls `requestVerification(email)`;
- `verifyEmail(token)` calls `confirmVerification(token)`;
- `login(email, password)` calls `authWithPassword`;
- `requestPasswordReset(email)`;
- `confirmPasswordReset(token, password, passwordConfirm)`;
- `deleteAccount()` deletes the authenticated user record and clears auth state.

Convert PocketBase errors to short user-safe messages at the form boundary. Do not expose raw response objects or log credentials.

**Step 2: Build signup and verification pages**

Signup requirements:

- native email and password inputs;
- name, password confirmation, autocomplete attributes;
- disabled submit while pending;
- generic success message instructing the user to check email;
- no automatic login before verification.

Verification reads `token` from the browser URL, confirms once, then offers login.

**Step 3: Build login**

On failed authentication, show a generic invalid-or-unverified message and offer “resend verification.” PocketBase's `authRule: verified = true` remains authoritative.

**Step 4: Build password reset**

The request page always shows the same success response whether the address exists or not. The confirmation page reads the token from the URL and requires matching passwords.

**Step 5: Build account and deletion**

The account page shows the user's name/email and logout. Account deletion requires a confirmation step with explicit irreversible wording. After deletion, clear auth and return to `/`.

Contributed-content anonymization is deferred because this slice creates no user content.

**Step 6: Exercise the complete flow locally**

Until Resend is configured, retrieve verification/reset links from PocketBase's local mail/log output. Verify:

1. signup succeeds;
2. login before verification fails;
3. verification succeeds;
4. login succeeds;
5. reload preserves auth;
6. logout clears auth;
7. reset flow changes the password;
8. account deletion removes access.

**Step 7: Verify and commit**

```bash
pnpm --dir web run check
pnpm --dir web run build
git add web
git commit -m "feat: add verified email authentication"
```

## Task 8: Final foundation verification and documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/technical-stack.md`
- Modify: `pocketbase/README.md`

**Step 1: Document the developer workflow**

Add exact commands for:

1. installing dependencies;
2. installing PocketBase;
3. starting PocketBase;
4. starting the website;
5. running checks;
6. building the static site.

Document that local data and credentials are not committed.

**Step 2: Verify no server-side application code exists**

Run:

```bash
find web/src -type f \( -name '+server.*' -o -name '*.server.*' -o -name 'hooks.server.*' \)
```

Expected: no output.

**Step 3: Run all automated checks fresh**

```bash
pnpm --dir web install --frozen-lockfile
pnpm --dir web run check
pnpm --dir web run build
git diff --check
```

With local PocketBase running, also run:

```bash
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090 \
PB_SUPERUSER_EMAIL='local value' \
PB_SUPERUSER_PASSWORD='local value' \
pnpm --dir web run test:pocketbase
```

Expected: all commands exit zero and the security script prints `PocketBase security checks passed`.

**Step 4: Review the browser manually**

At phone, tablet, and desktop widths verify homepage, signup, verification, login, password reset, account, logout, errors, and keyboard navigation.

**Step 5: Commit**

```bash
git add README.md docs/technical-stack.md pocketbase/README.md
git commit -m "docs: add local development workflow"
```

## Completion criteria

This foundation is complete only when:

- direct dependencies and PocketBase are pinned;
- the local PocketBase binary reports v0.39.11;
- an empty data directory can apply committed migrations;
- unverified users cannot authenticate at the PocketBase rule layer;
- clients cannot grant themselves Beekeeper access;
- the homepage loads the active hive from PocketBase;
- authentication and account deletion work from the responsive site;
- `pnpm --dir web run check`, `pnpm --dir web run build`, and the PocketBase security check pass;
- no SvelteKit server-side application files exist.

After this plan, the next plan should add Google/Apple OAuth and fully tested Queen/Worker hive-management rules before any content moderation UI.
