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

The implemented local foundation requires Node.js **20.19.0 or newer**, pnpm **10.34.5**, and PocketBase **v0.39.11**. Migrations are committed; local data and web environment configuration are ignored, and local credentials must not be committed.

Follow [Local PocketBase](pocketbase/README.md), the canonical setup and verification guide. It covers the pnpm-locked web install, pinned PocketBase install, isolated service, first local dashboard superuser, ignored `web/.env`, web startup, static checks, and safely prompted authorization security check. The documented installer and shell workflow support macOS and Linux only; Windows developers should follow that guide's WSL or manual pinned-binary instructions.

## Documentation

- [Brand foundation](docs/brand-foundation.md)
- [Product foundation](docs/product-foundation.md)
- [Content and category map](docs/content-taxonomy.md)
- [Technical stack](docs/technical-stack.md)
- [Initial data model and authorization rules](docs/data-model.md)
- [Website foundation implementation plan](docs/plans/2026-08-18-website-foundation-implementation.md)
- [Public directory and search design](docs/plans/2026-08-18-public-directory-design.md)
- [Public directory and search implementation plan](docs/plans/2026-08-18-public-directory-implementation.md)
- [Manta + Manabí seed listing candidates](docs/research/manta-manabi-seed-listing-candidates.md)
- [Manta + Manabí seed verification ledger](docs/research/manta-manabi-seed-verification-2026-08-18.md)

## Status

The local website foundation, public Manta + Manabí directory (search, category filtering, pagination, detail and empty/error states), PocketBase schema, validated ten-listing seed importer, email/password authentication flows, and authorization security check are implemented. Public listing reads are anonymous; listing publication and listing mutations remain Beekeeper-only. OAuth, Tauri, Queen/Worker mutations, contributor UI, staging and production deployment, Cloudflare R2, and Resend deployment configuration remain explicitly deferred.
