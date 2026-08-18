# Initial data model

PocketBase v0.39.11 stores the first website slice in three collections. Rules below are the exact collection rules in the migration; an empty rule is not used to make a collection public accidentally.

## `users` (auth)

The built-in email/password identity is `email`. Password authentication is enabled and `authRule` is `verified = true`, so unverified accounts cannot log in with a password.

| Field | Definition |
| --- | --- |
| `name` | required text, maximum 120 characters |
| `is_beekeeper` | boolean, default false; clients cannot assign it |

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
| `status` | single select: `active`, `inactive` |

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

## Tenant-scope invariant

Every future tenant-scoped record **must** have a required single `hive` relation to `hives`. Its list, view, and mutation rules must enforce that relation (or an explicitly reviewed beekeeper/operator exception); never infer tenant scope from a user-owned relation alone.
