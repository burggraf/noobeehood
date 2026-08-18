# Public Directory and Search Design

**Status:** Approved design
**Date:** 2026-08-18
**First hive:** Manta + Manabí, Ecuador

## Goal

Make the existing website useful by letting anyone browse and search a small, verified directory for the Manta + Manabí hive.

Questions from the existing audience research are search acceptance cases. Their answers are factual, verified listing results—not generated prose and not a separate Q&A content type.

## Existing research

The repository already contains:

- 40 candidate organizations and providers in [`docs/research/manta-manabi-seed-listing-candidates.md`](../research/manta-manabi-seed-listing-candidates.md);
- four broad launch categories and sample search questions in [`docs/content-taxonomy.md`](../content-taxonomy.md);
- the tenant and authorization invariants in [`docs/data-model.md`](../data-model.md).

The 40 candidates are a research queue only. They are not checked, endorsed, or ready to publish. No private-group post, username, or personal information will be imported.

## Scope

This slice includes:

- one tenant-scoped `listings` collection;
- a verified initial batch of approximately 12 public listings;
- a repeatable seed import;
- public search, category filtering, pagination, and listing details;
- PocketBase authorization and search integration checks;
- responsive and accessible browser states.

This slice excludes contributor submissions, moderation UI, ratings, reviews, maps, saved listings, analytics, sponsorships, Q&A records, OAuth, and Queen/Worker mutation permissions.

## Data model

Add one PocketBase base collection named `listings`.

| Field | Definition |
|---|---|
| `hive` | required single relation to `hives` |
| `name` | required text, maximum 160 characters |
| `slug` | required text, maximum 160 characters |
| `category` | required single select using the four launch category values |
| `listing_type` | required text, maximum 120 characters |
| `summary` | required text, maximum 500 characters |
| `location` | optional text, maximum 240 characters |
| `search_terms` | optional text containing factual aliases and offerings, maximum 1,000 characters |
| `website` | optional URL |
| `phone` | optional text, maximum 80 characters |
| `source_url` | required URL |
| `verification_method` | required single select: `source_checked`, `provider_confirmed`, or `editor_checked` |
| `last_verified_at` | required date |
| `next_review_at` | optional date |
| `status` | required single select: `draft`, `published`, or `archived` |

Category values are stable identifiers:

- `food-shopping-dining`;
- `healthcare-insurance`;
- `housing-household-services`;
- `transport-travel-experiences`.

A unique composite index on `(hive, slug)` prevents duplicates within a hive.

### Authorization

Public list and view rules allow only records where:

```text
status = 'published' && hive.status = 'active'
```

Create, update, and delete remain Beekeeper-only:

```text
@request.auth.is_beekeeper = true
```

The client will also filter by the route's hive, but PocketBase remains the authorization boundary. Queen and Worker mutation permissions remain deferred until they have dedicated tenant-boundary tests.

## Routes and interface

The active hive card on the homepage links to:

```text
/hives/manta-manabi/discover
```

The public routes are:

```text
/hives/[hive-slug]/discover
/hives/[hive-slug]/discover/[listing-slug]
```

The discovery page contains:

- a labeled search input;
- a four-option category filter;
- a Search button;
- result count;
- listing cards;
- previous and next pagination.

Search state lives in the URL:

```text
/hives/manta-manabi/discover?q=seafood&category=food-shopping-dining&page=1
```

Search runs on form submission. There is no autocomplete, live debounce, or background search in this slice.

## Search data flow

The client resolves the active hive by slug, then requests 20 matching `listings` records from PocketBase. Results sort by name initially.

Search matches these fields:

- `name`;
- `listing_type`;
- `summary`;
- `location`;
- `search_terms`.

User values must be bound with the PocketBase SDK's `pb.filter()` helper. They must never be interpolated directly into a filter expression. Category uses an exact allowlisted value.

Each result card shows the name, listing type, factual summary, location, verification method, and verification date. The detail page adds public phone, website, source, and a reminder to confirm details directly. No result is labeled “trusted,” “best,” or “recommended.”

Required client states are:

- loading;
- PocketBase unavailable;
- invalid or inactive hive;
- no published listings;
- no matching search results;
- successful results;
- missing or archived listing.

A no-results state suggests removing filters or trying broader terms. “Ask the hive” remains future intent and is not rendered as a nonfunctional control.

## Seed content and verification

The first public batch should contain approximately three listings from each launch category. Prefer stable official and institutional sources before private providers.

Before publication, an editor must confirm:

1. The organization still operates or serves Manta.
2. Its name, type, location, and public contact channel are accurate.
3. The source is official or clearly attributable.
4. Regulated providers have an appropriate registration source where applicable.
5. The summary contains no unsupported recommendation or quality claim.
6. Verification method, source URL, and `last_verified_at` are present.

Candidates that fail these checks stay out of PocketBase or remain hidden drafts. Publication is not an endorsement.

Verified seed content is stored separately from schema history:

```text
pocketbase/seeds/manta-manabi-listings.json
```

A small script imports it:

```text
scripts/import-listings.mjs
```

The script validates the complete file before writing, authenticates with safely prompted local PocketBase superuser credentials, and upserts by hive and slug. It prints no credentials or tokens and reports created, updated, skipped, and failed records. Upserts are idempotent so interrupted imports can be rerun.

Invalid categories, duplicate slugs, missing sources, missing verification dates, or unsupported states cause a nonzero exit.

## Search acceptance questions

Sample questions are acceptance cases rather than Q&A records:

| Question | Expected matching evidence |
|---|---|
| Where can I find seafood? | published food listing with seafood in factual searchable fields |
| Which pharmacy may carry this prescription? | published healthcare listing identified as a pharmacy, with a confirm-directly reminder |
| Is there an English-speaking dentist? | only a listing whose verified language/specialty text supports the match |
| What long-term rentals allow pets? | only listings with verified rental and pet-policy terms |
| Who offers Guayaquil airport pickup? | only verified transport listings with that route or service area |
| Are there whale-watching trips? | only a currently verified operator carrying the relevant offering and season information |

An acceptance case may legitimately return no results when the corresponding claim has not been verified. The product must prefer an honest gap over an invented answer.

## Testing and security

Extend the current PocketBase integration approach rather than adding a test framework. Synthetic test records must prove:

- anonymous visitors can list and view published listings;
- draft and archived listings remain hidden;
- listings for inactive hives remain hidden;
- regular and unverified users cannot create, update, publish, archive, or delete listings;
- Beekeepers can manage listings;
- duplicate `(hive, slug)` records fail;
- malicious search input cannot escape `pb.filter()` parameter binding;
- all synthetic records are cleaned up.

Seed validation must check every committed entry without requiring network access. Current public facts must be verified separately before seed data is committed.

Client verification covers:

- direct, searched, filtered, and paginated URLs;
- detail routes;
- all loading, empty, missing, and error states;
- keyboard operation and visible focus;
- phone, tablet, and desktop layouts;
- static client-only build with no SvelteKit server files.

## Delivery sequence

1. Add failing listing authorization and schema checks.
2. Add the reversible `listings` migration and update the data-model documentation.
3. Verify the initial candidate batch against current public sources.
4. Add and validate the seed JSON and idempotent importer.
5. Add listing types and the safe PocketBase query helper.
6. Build discovery and detail routes.
7. Link the homepage hive card to discovery.
8. Run PocketBase integration checks, seed acceptance checks, Svelte checks, static build, and responsive browser review.

## Success criteria

The slice is complete when a fresh local environment can apply migrations, import the verified seed batch, and answer the accepted sample searches while:

- exposing only published records for active hives;
- keeping drafts and archived records private;
- preventing unauthorized mutations;
- showing source and verification dates;
- returning honest no-results states;
- remaining responsive, keyboard-operable, and client-only.
