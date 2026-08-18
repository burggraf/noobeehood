# Public Directory and Search Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Add a secure, tenant-scoped public directory for the Manta + Manabí hive, import a verified initial listing batch, and answer agreed sample searches with factual listing results.

**Architecture:** Add one PocketBase `listings` collection with public read rules for published records in active hives and Beekeeper-only mutations. Keep changing seed content outside schema migrations in validated JSON, import it idempotently with the existing PocketBase SDK, and query it directly from the client-only SvelteKit app using safely bound PocketBase filters.

**Tech Stack:** PocketBase v0.39.11 JavaScript migrations, PocketBase JavaScript SDK 0.27.3, Svelte 5.56.9, SvelteKit 2.70.2, TypeScript, Node.js built-in assertions/tests, pnpm 10.34.5.

---

## Constraints

- Work directly on `main`; do not create a worktree.
- Keep the application client-only. Do not create `+server.*`, `*.server.*`, or `hooks.server.*` files.
- PocketBase rules are the authorization boundary.
- Use `pb.filter()` for every filter containing user input.
- Publish only facts checked against current public sources.
- Never describe inclusion as an endorsement or recommendation.
- Do not add a test framework or new dependency.
- Do not add contributor submissions, moderation UI, ratings, reviews, maps, saved listings, analytics, Q&A records, OAuth, or Queen/Worker mutation permissions.
- Keep one writer on `main`; use read-only reviewers after each implementation task.

## Reference documents

Read before implementation:

- `docs/plans/2026-08-18-public-directory-design.md`
- `docs/research/manta-manabi-seed-listing-candidates.md`
- `docs/content-taxonomy.md`
- `docs/data-model.md`
- `pocketbase/pb_migrations/1787057776_initial_schema.js`
- `scripts/check-pocketbase.mjs`
- `pocketbase/README.md`

## Local verification fixture

Use a disposable PocketBase data directory for migration and authorization work. Never use staging or production credentials.

From the repository root:

```bash
rm -rf /tmp/noobeehood-directory-pb
mkdir -m 700 /tmp/noobeehood-directory-pb
./pocketbase/pocketbase migrate up \
  --dir=/tmp/noobeehood-directory-pb \
  --migrationsDir=./pocketbase/pb_migrations
```

Create a temporary local superuser with a prompted password:

```bash
PB_SUPERUSER_EMAIL='directory-check@example.test'
read -r -s -p 'Temporary PocketBase superuser password: ' PB_SUPERUSER_PASSWORD
printf '\n'
./pocketbase/pocketbase superuser create \
  "$PB_SUPERUSER_EMAIL" "$PB_SUPERUSER_PASSWORD" \
  --dir=/tmp/noobeehood-directory-pb
```

Start the disposable service in its own managed process:

```bash
./pocketbase/pocketbase serve \
  --dir=/tmp/noobeehood-directory-pb \
  --migrationsDir=./pocketbase/pb_migrations \
  --http=127.0.0.1:8091
```

Commands below that require PocketBase use:

```bash
PUBLIC_POCKETBASE_URL='http://127.0.0.1:8091' \
PB_SUPERUSER_EMAIL="$PB_SUPERUSER_EMAIL" \
PB_SUPERUSER_PASSWORD="$PB_SUPERUSER_PASSWORD" \
  pnpm --dir web run test:pocketbase
```

Stop the managed process and delete `/tmp/noobeehood-directory-pb` when finished.

---

### Task 1: Add the tenant-scoped listings schema and authorization checks

**Files:**
- Create: `pocketbase/pb_migrations/1787068800_listings.js`
- Modify: `scripts/check-pocketbase.mjs`
- Modify: `docs/data-model.md`

**Step 1: Extend the integration check before creating the migration**

Add synthetic listing checks to `scripts/check-pocketbase.mjs`. Use unique slugs based on `randomUUID()` and track all created IDs for cleanup.

The check must attempt to resolve `listings` and then cover these cases:

```js
const publicListings = await publicClient.collection("listings").getList(1, 50);
assert.deepEqual(publicListings.items.map((record) => record.id), [publishedListingId]);

await assert.rejects(
  publicClient.collection("listings").getOne(draftListingId),
  (error) => error?.status === 404,
);

await assert.rejects(
  userClient.collection("listings").create(validListingBody),
);

await assert.rejects(
  userClient.collection("listings").update(publishedListingId, { name: "Changed" }),
);

await assert.rejects(
  userClient.collection("listings").delete(publishedListingId),
);
```

Create these fixtures through the authenticated superuser client:

- one published listing in the active `manta-manabi` hive;
- one draft listing in that hive;
- one archived listing in that hive;
- one published listing in a temporary inactive hive.

Create a second verified auth user with `is_beekeeper: true` through the superuser client, authenticate it through a separate SDK client, and prove that client can create, update, and delete a listing.

Attempt a duplicate `(hive, slug)` create and assert rejection.

Cleanup order in `finally` must be:

1. synthetic listings;
2. temporary inactive hive;
3. synthetic users.

Use `pb.filter()` rather than string interpolation in cleanup lookups.

**Step 2: Run the check and verify it fails**

Run the disposable PocketBase fixture with only the existing initial migration.

Expected: `pnpm --dir web run test:pocketbase` exits nonzero because the `listings` collection does not exist.

**Step 3: Add the reversible migration**

Create `pocketbase/pb_migrations/1787068800_listings.js`:

```js
migrate((app) => {
  const hives = app.findCollectionByNameOrId("hives");

  const listings = new Collection({
    type: "base",
    name: "listings",
    listRule: "status = 'published' && hive.status = 'active'",
    viewRule: "status = 'published' && hive.status = 'active'",
    createRule: "@request.auth.is_beekeeper = true",
    updateRule: "@request.auth.is_beekeeper = true",
    deleteRule: "@request.auth.is_beekeeper = true",
    fields: [
      { name: "hive", type: "relation", required: true, maxSelect: 1, collectionId: hives.id },
      { name: "name", type: "text", required: true, max: 160 },
      { name: "slug", type: "text", required: true, max: 160 },
      {
        name: "category",
        type: "select",
        required: true,
        maxSelect: 1,
        values: [
          "food-shopping-dining",
          "healthcare-insurance",
          "housing-household-services",
          "transport-travel-experiences",
        ],
      },
      { name: "listing_type", type: "text", required: true, max: 120 },
      { name: "summary", type: "text", required: true, max: 500 },
      { name: "location", type: "text", max: 240 },
      { name: "search_terms", type: "text", max: 1000 },
      { name: "website", type: "url" },
      { name: "phone", type: "text", max: 80 },
      { name: "source_url", type: "url", required: true },
      {
        name: "verification_method",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["source_checked", "provider_confirmed", "editor_checked"],
      },
      { name: "last_verified_at", type: "date", required: true },
      { name: "next_review_at", type: "date" },
      {
        name: "status",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["draft", "published", "archived"],
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_listings_hive_slug ON listings (hive, slug)",
    ],
  });

  app.save(listings);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("listings"));
});
```

Do not seed business/provider content in this migration.

**Step 4: Recreate the disposable database and rerun the integration check**

Delete and recreate `/tmp/noobeehood-directory-pb`, apply migrations, recreate the temporary superuser, and restart PocketBase.

Run:

```bash
PUBLIC_POCKETBASE_URL='http://127.0.0.1:8091' \
PB_SUPERUSER_EMAIL="$PB_SUPERUSER_EMAIL" \
PB_SUPERUSER_PASSWORD="$PB_SUPERUSER_PASSWORD" \
  pnpm --dir web run test:pocketbase
```

Expected final line:

```text
PocketBase security checks passed
```

**Step 5: Prove rollback and reapply**

Run against a stopped disposable instance:

```bash
./pocketbase/pocketbase migrate down 1 \
  --dir=/tmp/noobeehood-directory-pb \
  --migrationsDir=./pocketbase/pb_migrations

./pocketbase/pocketbase migrate up \
  --dir=/tmp/noobeehood-directory-pb \
  --migrationsDir=./pocketbase/pb_migrations
```

Expected: rollback removes `listings`; reapply succeeds without changing the initial collections.

**Step 6: Document the exact schema and rules**

Append `listings` to `docs/data-model.md`, including all fields, the composite index, public rules, Beekeeper-only mutations, and the fact that seed content is separate from migrations.

**Step 7: Review and commit**

Request spec and security review. Fix blocker/important findings, rerun the integration check, then commit:

```bash
git add pocketbase/pb_migrations/1787068800_listings.js scripts/check-pocketbase.mjs docs/data-model.md
git commit -m "feat: add public listings schema"
```

---

### Task 2: Verify the first publication candidates

**Files:**
- Create: `docs/research/manta-manabi-seed-verification-2026-08-18.md`
- Read: `docs/research/manta-manabi-seed-listing-candidates.md`

**Step 1: Start with a balanced 12-candidate queue**

Attempt to verify three candidates per category:

Food, shopping, and dining:

- Supermaxi / Megamaxi Manta;
- Mercado Central Municipal;
- Mall del Pacífico.

Healthcare and insurance:

- Hospital General Dr. Rafael Rodríguez Zambrano;
- MantaMed;
- Fybeca Manta.

Housing and household services:

- CNEL EP Unidad de Negocio Manabí;
- EPAM;
- Fumigerbo.

Transportation, travel, and experiences:

- Terminal Terrestre Luis Valdivieso Morán;
- Aeropuerto Internacional Eloy Alfaro;
- Charter Manta.

If a target cannot be verified, reject it and replace it with another candidate from the same category. Do not lower the evidence requirement to preserve a count of 12.

**Step 2: Verify current facts from public sources**

For each candidate, use current official/institutional/provider pages and, where needed, registration sources. Record exact source passages for:

- current operation or Manta service area;
- public name and listing type;
- location or service area;
- public website/contact channel;
- only the offerings that will appear in `summary` or `search_terms`;
- professional or tourism registration when applicable.

Do not infer languages, accessibility, pet policies, availability, routes, seasons, or quality.

**Step 3: Write the evidence ledger**

For every accepted candidate, record:

```markdown
### Candidate name

- Decision: accept | reject
- Category:
- Listing type:
- Verified claims:
- Official source URL:
- Registration source URL, if applicable:
- Verification method: source_checked | provider_confirmed | editor_checked
- Verified on: 2026-08-18
- Next review date:
- Notes/limitations:
```

For rejected candidates, state the failed criterion without publishing stale contact details.

**Step 4: Review for claims and privacy**

Request an independent research/spec review. Confirm that:

- every public claim has evidence;
- no listing is called trusted, best, recommended, or safe;
- no private-group material or personal information appears;
- unsupported sample questions are allowed to return no result.

**Step 5: Commit**

```bash
git add docs/research/manta-manabi-seed-verification-2026-08-18.md
git commit -m "docs: verify initial Manta listings"
```

---

### Task 3: Add validated seed data and an idempotent importer

**Files:**
- Create: `pocketbase/seeds/manta-manabi-listings.json`
- Create: `pocketbase/seeds/manta-manabi-search-cases.json`
- Create: `scripts/listing-seed.mjs`
- Create: `scripts/check-listing-seed.mjs`
- Create: `scripts/import-listings.mjs`
- Modify: `web/package.json`
- Modify: `pocketbase/README.md`

**Step 1: Write the failing seed validation check**

Create `scripts/check-listing-seed.mjs` using `node:assert/strict` and `node:test`-style assertions. It should import `validateListings` and `validateSearchCases` from the missing `scripts/listing-seed.mjs`, load the two missing JSON files, and assert that validation succeeds.

Also assert rejection for minimal mutated fixtures:

```js
assert.throws(() => validateListings([{ ...valid, category: "other" }]));
assert.throws(() => validateListings([valid, { ...valid }]));
assert.throws(() => validateListings([{ ...valid, source_url: "" }]));
assert.throws(() => validateListings([{ ...valid, last_verified_at: "not-a-date" }]));
```

**Step 2: Add scripts and run the check to verify it fails**

Add to `web/package.json`:

```json
"check:seeds": "node ../scripts/check-listing-seed.mjs",
"seed:listings": "node ../scripts/import-listings.mjs"
```

Run:

```bash
pnpm --dir web run check:seeds
```

Expected: failure because the validator/data files do not exist.

**Step 3: Implement the stdlib-only validator**

Create `scripts/listing-seed.mjs` with:

```js
import { readFile } from "node:fs/promises";

export const categories = new Set([
  "food-shopping-dining",
  "healthcare-insurance",
  "housing-household-services",
  "transport-travel-experiences",
]);

export const verificationMethods = new Set([
  "source_checked",
  "provider_confirmed",
  "editor_checked",
]);

export const statuses = new Set(["draft", "published", "archived"]);

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
```

`validateListings(records)` must validate the top-level array before returning it. For every entry require:

- `name`, `slug`, `category`, `listing_type`, `summary`, `source_url`, `verification_method`, `last_verified_at`, and `status`;
- slug matching `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`;
- an allowlisted category, verification method, and status;
- an HTTP(S) source URL and HTTP(S) website when present;
- parseable verification/review dates;
- maximum lengths matching the migration;
- unique slugs within the Manta seed file.

`validateSearchCases(cases, listings)` must require:

- unique nonempty `query` strings;
- optional allowlisted category;
- `expected_slugs` as an array;
- every expected slug to exist in the listing file and have `status: "published"`.

Validate the whole input before any importer network call.

**Step 4: Create the verified seed JSON**

Translate only accepted evidence-ledger entries into `pocketbase/seeds/manta-manabi-listings.json`.

Each object follows this shape:

```json
{
  "name": "Verified public name",
  "slug": "verified-public-name",
  "category": "food-shopping-dining",
  "listing_type": "Public market",
  "summary": "Short factual description supported by the source.",
  "location": "Verified public location or service area",
  "search_terms": "Only verified aliases and offerings",
  "website": "https://official.example/",
  "phone": "",
  "source_url": "https://official.example/source",
  "verification_method": "source_checked",
  "last_verified_at": "2026-08-18T00:00:00.000Z",
  "next_review_at": "2026-11-18T00:00:00.000Z",
  "status": "published"
}
```

Do not add fields containing unsupported claims merely to make a sample search pass.

**Step 5: Create the search acceptance JSON**

Create `pocketbase/seeds/manta-manabi-search-cases.json`:

```json
[
  {
    "query": "seafood",
    "category": "food-shopping-dining",
    "expected_slugs": ["only-if-supported"]
  },
  {
    "query": "pet-friendly rental",
    "category": "housing-household-services",
    "expected_slugs": []
  }
]
```

Include the agreed seafood, pharmacy, dentist, pet-friendly rental, Guayaquil airport pickup, and whale-watching questions. Empty expected results are correct when the researched batch does not verify the claim.

**Step 6: Run the validator**

```bash
pnpm --dir web run check:seeds
```

Expected: exit zero and a concise line such as:

```text
Listing seed checks passed
```

**Step 7: Write the importer**

Create `scripts/import-listings.mjs` using the same environment-validation pattern as `scripts/check-pocketbase.mjs`.

Required flow:

1. validate `PUBLIC_POCKETBASE_URL`, `PB_SUPERUSER_EMAIL`, and `PB_SUPERUSER_PASSWORD`;
2. load and fully validate both JSON files;
3. authenticate `_superusers`;
4. resolve the active `manta-manabi` hive;
5. for each listing, find by safely bound `(hive, slug)`;
6. update the existing record or create a new one;
7. run every search acceptance case through a separate anonymous client using `pb.filter()`;
8. assert that all expected slugs are present and that empty-result cases are empty;
9. print created/updated/skipped totals without record tokens or credentials;
10. set a nonzero exit code if any write or acceptance case fails.

Use safe lookup binding:

```js
const filter = adminClient.filter(
  "hive = {:hive} && slug = {:slug}",
  { hive: hive.id, slug: listing.slug },
);
```

Build search filters from fixed expressions plus bound parameters. Never concatenate query text.

**Step 8: Run the importer twice**

Against the disposable migrated PocketBase instance:

```bash
PUBLIC_POCKETBASE_URL='http://127.0.0.1:8091' \
PB_SUPERUSER_EMAIL="$PB_SUPERUSER_EMAIL" \
PB_SUPERUSER_PASSWORD="$PB_SUPERUSER_PASSWORD" \
  pnpm --dir web run seed:listings
```

Expected first run: records are created and search cases pass.

Run the same command again.

Expected second run: no duplicates; records are updated or skipped deterministically, and search cases still pass.

**Step 9: Document the commands and commit**

Add safely prompted `check:seeds` and `seed:listings` instructions to `pocketbase/README.md`. State that the importer is local/staging tooling, not a production credential-storage mechanism.

Request quality/security review, then commit:

```bash
git add pocketbase/seeds scripts/listing-seed.mjs scripts/check-listing-seed.mjs scripts/import-listings.mjs web/package.json web/pnpm-lock.yaml pocketbase/README.md
git commit -m "feat: add verified listing seed import"
```

---

### Task 4: Add the safe listing query layer

**Files:**
- Create: `web/src/lib/listing-filter.js`
- Create: `web/tests/listing-filter.test.mjs`
- Create: `web/src/lib/listings.ts`
- Modify: `web/src/lib/types.ts`
- Modify: `web/package.json`

**Step 1: Write a real unit test for filter construction**

Create `web/tests/listing-filter.test.mjs` using `node:test` and `node:assert/strict`.

Test:

- hive is always required;
- blank search is omitted;
- all five searchable fields are included for nonblank search;
- allowlisted category is included;
- unknown category is omitted;
- malicious query text appears only in the parameter object, never in the filter expression;
- page normalization clamps invalid values to page 1.

Example:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createListingQuery } from "../src/lib/listing-filter.js";

test("keeps untrusted search text out of the expression", () => {
  const query = "x' || status != 'draft";
  const result = createListingQuery({ hiveId: "hive-id", query, category: "", page: 1 });
  assert.equal(result.expression.includes(query), false);
  assert.equal(result.params.query, query);
});
```

Add:

```json
"test:unit": "node --test tests/*.test.mjs"
```

Run:

```bash
pnpm --dir web run test:unit
```

Expected: fail because `listing-filter.js` does not exist.

**Step 2: Implement the minimal pure query builder**

Create `web/src/lib/listing-filter.js` with JSDoc types and no PocketBase import. Return:

```js
{
  expression: "hive = {:hive} && (...)",
  params: { hive: hiveId, query, category },
  page: normalizedPage,
  perPage: 20,
}
```

The caller will pass `expression` and `params` to `pb.filter()`. This keeps untrusted text out of the expression and makes the logic testable with Node's built-in runner.

**Step 3: Run the unit test**

```bash
pnpm --dir web run test:unit
```

Expected: all filter tests pass.

**Step 4: Add domain types**

Append to `web/src/lib/types.ts`:

```ts
export type ListingCategory =
  | 'food-shopping-dining'
  | 'healthcare-insurance'
  | 'housing-household-services'
  | 'transport-travel-experiences';

export type ListingStatus = 'draft' | 'published' | 'archived';
export type VerificationMethod = 'source_checked' | 'provider_confirmed' | 'editor_checked';

export type Listing = {
  id: string;
  hive: string;
  name: string;
  slug: string;
  category: ListingCategory;
  listing_type: string;
  summary: string;
  location: string;
  search_terms: string;
  website: string;
  phone: string;
  source_url: string;
  verification_method: VerificationMethod;
  last_verified_at: string;
  next_review_at: string;
  status: ListingStatus;
};
```

**Step 5: Add the PocketBase service wrapper**

Create `web/src/lib/listings.ts` exporting:

```ts
export async function getActiveHive(slug: string): Promise<Hive>;
export async function listListings(input: {
  hiveId: string;
  query: string;
  category: string;
  page: number;
}): Promise<ListResult<Listing>>;
export async function getListing(hiveId: string, slug: string): Promise<Listing>;
```

Use `pb.filter(expression, params)` with the pure query builder. Use `getList(page, 20, { sort: 'name', filter })` for discovery and `getFirstListItem` with safely bound hive/slug parameters for detail.

Do not expose raw PocketBase errors to UI callers.

**Step 6: Verify and commit**

```bash
pnpm --dir web run test:unit
pnpm --dir web run check
pnpm --dir web run build
git diff --check
```

Expected: zero unit-test failures, zero Svelte diagnostics, and successful static build.

Request quality/security review, then commit:

```bash
git add web/src/lib/listing-filter.js web/tests/listing-filter.test.mjs web/src/lib/listings.ts web/src/lib/types.ts web/package.json web/pnpm-lock.yaml
git commit -m "feat: add safe listing queries"
```

---

### Task 5: Build public discovery search

**Files:**
- Create: `web/src/routes/hives/[hive]/discover/+page.svelte`
- Modify: `web/src/app.css`

**Step 1: Create the route with explicit state**

The page must model:

```ts
type Status = 'loading' | 'success' | 'empty' | 'no-results' | 'invalid-hive' | 'error';
```

Use `page.params.hive` and `page.url.searchParams` from `$app/state`. Read:

- `q` as trimmed text;
- `category` only when allowlisted;
- `page` as a positive integer, defaulting to 1.

Use a reactive effect keyed by the route slug and URL search string. Give each request a unique PocketBase `requestKey`, cancel it during cleanup, and ignore stale responses.

**Step 2: Render an accessible GET search form**

Use native form controls:

```svelte
<form method="GET" class="directory-search" aria-describedby="search-help">
  <label for="directory-query">What are you looking for?</label>
  <input id="directory-query" name="q" value={query} />

  <label for="directory-category">Category</label>
  <select id="directory-category" name="category">
    <option value="">All categories</option>
    <!-- four fixed options -->
  </select>

  <button class="button primary" type="submit">Search</button>
</form>
```

A native GET form keeps the URL shareable and works without custom debounce logic.

**Step 3: Render all required states**

- `loading`: polite status message;
- `invalid-hive`: clear missing/inactive neighborhood message and home link;
- `error`: backend-unavailable message without raw errors;
- `empty`: active hive has no published listings;
- `no-results`: suggest broader terms or removing filters;
- `success`: result count, cards, and pagination.

Do not show a fake “Ask the hive” button.

**Step 4: Render factual result cards**

Each card shows:

- `name`;
- `listing_type`;
- `summary`;
- `location` when present;
- formatted `last_verified_at`;
- link to `/hives/{hiveSlug}/discover/{listing.slug}`.

Never render `search_terms` directly.

**Step 5: Add simple pagination links**

Preserve `q` and `category` with `URLSearchParams`. Show Previous only when page > 1 and Next only when page < total pages. Include an accessible page summary.

**Step 6: Add responsive styles**

In `web/src/app.css`, add only the classes required for:

- directory heading and form;
- responsive card grid;
- metadata list;
- result summary;
- pagination.

Use the existing tokens, focus styles, `.wrapper`, `.state`, and `.button`. Do not add a component library.

**Step 7: Verify in browser and commit**

With the disposable PocketBase instance seeded, test:

```text
/hives/manta-manabi/discover
/hives/manta-manabi/discover?q=seafood
/hives/manta-manabi/discover?category=healthcare-insurance
/hives/manta-manabi/discover?q=x%27%20%7C%7C%20status%20%21%3D%20%27draft
/hives/unknown/discover
```

Check keyboard behavior and widths 375px, 768px, and 1280px. Confirm no console errors.

Run:

```bash
pnpm --dir web run test:unit
pnpm --dir web run check
pnpm --dir web run build
```

Request UI/spec review, then commit:

```bash
git add web/src/routes/hives/[hive]/discover/+page.svelte web/src/app.css
git commit -m "feat: add public directory search"
```

---

### Task 6: Add listing details and homepage discovery link

**Files:**
- Create: `web/src/routes/hives/[hive]/discover/[listing]/+page.svelte`
- Modify: `web/src/routes/+page.svelte`
- Modify: `web/src/app.css`

**Step 1: Build the detail route**

Resolve the active hive, then fetch the listing with safely bound hive ID and listing slug. Model:

```ts
type Status = 'loading' | 'success' | 'missing' | 'error';
```

Because the PocketBase view rule hides drafts, archived records, and inactive-hive records, all inaccessible records use the same missing state.

**Step 2: Render factual details**

Show:

- name;
- listing type and category label;
- summary;
- location when present;
- phone and website only when present;
- source link;
- verification method in plain language;
- verification date;
- “Confirm details directly before relying on availability, hours, pricing, or services.”

Use normal `<a>` links for phone, website, source, back to results, and home. External links must not imply endorsement.

**Step 3: Link the homepage hive card**

In `web/src/routes/+page.svelte`, make the active hive card's discovery action point to:

```svelte
<a class="button primary" href={`/hives/${hive.slug}/discover`}>Explore this hive</a>
```

Do not hard-code `manta-manabi` in the card loop.

**Step 4: Add detail styles and verify**

Reuse existing layout and typography. Add only detail metadata/contact styles that are not already available.

Test:

- a published listing;
- an unknown slug;
- direct reload of both URLs;
- browser back to preserved search query;
- phone, tablet, and desktop widths;
- keyboard-only navigation.

Run:

```bash
pnpm --dir web run test:unit
pnpm --dir web run check
pnpm --dir web run build
test -f web/build/200.html
```

**Step 5: Review and commit**

Request UI/accessibility/spec review, fix important findings, then commit:

```bash
git add web/src/routes/+page.svelte web/src/routes/hives/[hive]/discover/[listing]/+page.svelte web/src/app.css
git commit -m "feat: add public listing details"
```

---

### Task 7: Final verification and documentation

**Files:**
- Modify: `README.md`
- Modify: `pocketbase/README.md`
- Modify: `docs/technical-stack.md`
- Modify: `docs/data-model.md` if implementation details changed during review

**Step 1: Update canonical local instructions**

Document, in `pocketbase/README.md`, this order:

```bash
pnpm --dir web install --frozen-lockfile
pnpm --dir web run check:seeds
# start migrated PocketBase and prompt for temporary local superuser credentials
pnpm --dir web run seed:listings
pnpm --dir web run test:pocketbase
pnpm --dir web run test:unit
pnpm --dir web run check
pnpm --dir web run build
```

Keep credential prompting canonical and do not duplicate the full workflow across multiple docs.

**Step 2: Update status documentation**

- `README.md`: state that public directory/search is implemented and link the design/research.
- `docs/technical-stack.md`: record the listings collection, public read model, Beekeeper-only publication, and seed/import approach.
- `docs/data-model.md`: confirm the migration and actual rules exactly match documentation.

Keep OAuth, Queen/Worker mutations, contributor UI, R2, and production deployment explicitly deferred.

**Step 3: Run all checks from a clean dependency install**

```bash
rm -rf web/node_modules
pnpm --dir web install --frozen-lockfile
pnpm --dir web run check:seeds
pnpm --dir web run test:unit
pnpm --dir web run check
pnpm --dir web run build
test -f web/build/200.html
git diff --check
```

Expected: all commands exit zero.

**Step 4: Run fresh PocketBase verification**

Create a new empty disposable data directory, apply all migrations, create a temporary superuser, start PocketBase, then run:

```bash
PUBLIC_POCKETBASE_URL='http://127.0.0.1:8091' \
PB_SUPERUSER_EMAIL="$PB_SUPERUSER_EMAIL" \
PB_SUPERUSER_PASSWORD="$PB_SUPERUSER_PASSWORD" \
  pnpm --dir web run test:pocketbase

PUBLIC_POCKETBASE_URL='http://127.0.0.1:8091' \
PB_SUPERUSER_EMAIL="$PB_SUPERUSER_EMAIL" \
PB_SUPERUSER_PASSWORD="$PB_SUPERUSER_PASSWORD" \
  pnpm --dir web run seed:listings
```

Run the importer twice. Expected:

- security check prints `PocketBase security checks passed`;
- first import creates records and all search cases pass;
- second import creates no duplicates and all search cases still pass.

Stop PocketBase, remove the disposable data and credential variables, and confirm no credentials were written inside the repository.

**Step 5: Confirm client-only boundaries**

```bash
find web/src -type f \( -name '+server.*' -o -name '*.server.*' -o -name 'hooks.server.*' \)
```

Expected: no output.

**Step 6: Final responsive and accessibility review**

Test homepage, discovery, results, no-results, invalid hive, published detail, and missing detail at:

- 375 × 812;
- 768 × 1024;
- 1280 × 800.

Use keyboard-only navigation, verify visible focus, inspect console/network errors, and test reduced-motion preference.

**Step 7: Final review and commit**

Request final spec, security, and quality review across the complete directory range. Fix blocker/important findings and rerun affected checks.

Commit documentation changes:

```bash
git add README.md pocketbase/README.md docs/technical-stack.md docs/data-model.md
git commit -m "docs: document public directory workflow"
```

Confirm:

```bash
git status --short
```

Expected: clean working tree.

## Completion criteria

The directory slice is complete only when:

- the `listings` migration applies, rolls back, and reapplies on disposable data;
- public rules expose only published listings in active hives;
- regular and unverified users cannot mutate listings;
- Beekeepers can manage listings;
- duplicate hive/slug records fail;
- every published seed claim has recorded current-source evidence;
- seed validation and import are reproducible and idempotent;
- agreed sample searches return only supported results or honest empty states;
- homepage, discovery, and detail pages work responsively and by keyboard;
- unit, seed, PocketBase, Svelte, and build checks pass;
- no SvelteKit server application files exist;
- the working tree is clean.
