# Initial data model

PocketBase v0.39.11 stores the first website slice in four collections. Rules below are the exact collection rules in the migration; an empty rule is not used to make a collection public accidentally.

## `users` (auth)

The built-in email/password identity is `email`. Password authentication is enabled and `authRule` is `verified = true`, so unverified accounts cannot log in with a password.

| Field | Definition |
| --- | --- |
| `name` | required text, maximum 120 characters |
| `is_beekeeper` | boolean, false by the PocketBase v0.39.11 BoolField zero value/default; clients cannot assign it |

Rules:

```text
list:   id = @request.auth.id || @request.auth.is_beekeeper = true
view:   id = @request.auth.id || @request.auth.is_beekeeper = true
create: @request.body.is_beekeeper:isset = false
update: id = @request.auth.id && @request.body.is_beekeeper:isset = false
delete: id = @request.auth.id
manage: @request.auth.is_beekeeper = true
auth:   verified = true
```

A client may register without `is_beekeeper`, but cannot self-promote. Beekeeper status is managed by an authorized operator through the manage rule.

## `hives` (base)

| Field | Definition |
| --- | --- |
| `name` | required text, maximum 120 characters |
| `slug` | required text, maximum 120 characters, unique |
| `status` | required single select: `active`, `inactive` |

Rules:

```text
list/view: status = 'active' || @request.auth.is_beekeeper = true
create/update/delete: @request.auth.is_beekeeper = true
```

The migration seeds one active hive: `Manta + Manabí` (`manta-manabi`).

## `memberships` (base)

| Field | Definition |
| --- | --- |
| `hive` | required single relation to `hives` |
| `user` | required single relation to `users`, cascade delete |
| `role` | required single select: `queen`, `worker`, `member` |
| `status` | required single select: `active`, `invited`, `suspended` |

A unique composite index on `(hive, user)` prevents duplicate memberships.

Rules:

```text
list/view: user = @request.auth.id || @request.auth.is_beekeeper = true
create/update/delete: @request.auth.is_beekeeper = true
```

The first slice stores Queen and Worker roles but does not yet authorize Queen/Worker management. Only Beekeepers can mutate hives and memberships; hive-scoped role management should be added with dedicated authorization tests.

## `listings` (base)

| Field | Definition |
| --- | --- |
| `hive` | required single relation to `hives` |
| `name` | required text, maximum 160 characters |
| `slug` | required text, maximum 160 characters |
| `category` | required single select: `food-shopping-dining`, `healthcare-insurance`, `housing-household-services`, `transport-travel-experiences` |
| `listing_type` | required text, maximum 120 characters |
| `summary` | required text, maximum 500 characters |
| `location` | optional text, maximum 240 characters |
| `search_terms` | optional text, maximum 1,000 characters |
| `website` | optional URL |
| `phone` | optional text, maximum 80 characters |
| `source_url` | required URL |
| `verification_method` | required single select: `source_checked`, `provider_confirmed`, `editor_checked` |
| `last_verified_at` | required date |
| `next_review_at` | optional date |
| `status` | required single select: `draft`, `published`, `archived` |

A unique composite index on `(hive, slug)` prevents duplicate listings within a hive. Business/provider content is not seeded by the schema migration; changing content belongs in a separate validated seed/import workflow.

Rules:

```text
list/view: status = 'published' && hive.status = 'active'
create/update/delete: @request.auth.is_beekeeper = true
```

Public list and view access is limited to published listings in active hives. Only Beekeepers can create, update, or delete listings; Queen and Worker mutation permissions remain deferred until dedicated tenant-boundary tests exist.

## Tenant-scope invariant

Every future tenant-scoped record **must** have a required single `hive` relation to `hives`. Its list, view, and mutation rules must enforce that relation (or an explicitly reviewed beekeeper/operator exception); never infer tenant scope from a user-owned relation alone.
