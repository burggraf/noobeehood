/// <reference path="../pb_data/types.d.ts" />

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
