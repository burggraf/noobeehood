/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  let users;
  let newUsers = false;
  try {
    users = app.findCollectionByNameOrId("users");
  } catch (error) {
    newUsers = true;
    users = new Collection({
      type: "auth",
      name: "users",
      fields: [
        { name: "name", type: "text", required: true, max: 120 },
        { name: "is_beekeeper", type: "bool" },
      ],
    });
  }
  users.authRule = "verified = true";
  users.listRule = "id = @request.auth.id || @request.auth.is_beekeeper = true";
  users.viewRule = "id = @request.auth.id || @request.auth.is_beekeeper = true";
  users.createRule = "@request.body.is_beekeeper:isset = false";
  users.updateRule = "id = @request.auth.id && @request.body.is_beekeeper:isset = false";
  users.deleteRule = "id = @request.auth.id";
  users.manageRule = "@request.auth.is_beekeeper = true";
  users.passwordAuth = { enabled: true, identityFields: ["email"] };
  const nameField = users.fields.getByName("name");
  nameField.required = true;
  nameField.max = 120;
  if (!newUsers) users.fields.add(new BoolField({ name: "is_beekeeper" }));
  app.save(users);

  const hives = new Collection({
    type: "base",
    name: "hives",
    listRule: "status = 'active' || @request.auth.is_beekeeper = true",
    viewRule: "status = 'active' || @request.auth.is_beekeeper = true",
    createRule: "@request.auth.is_beekeeper = true",
    updateRule: "@request.auth.is_beekeeper = true",
    deleteRule: "@request.auth.is_beekeeper = true",
    fields: [
      { name: "name", type: "text", required: true, max: 120 },
      { name: "slug", type: "text", required: true, max: 120 },
      { name: "status", type: "select", required: true, values: ["active", "inactive"], maxSelect: 1 },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_hives_slug ON hives (slug)"],
  });
  app.save(hives);

  const memberships = new Collection({
    type: "base",
    name: "memberships",
    listRule: "user = @request.auth.id || @request.auth.is_beekeeper = true",
    viewRule: "user = @request.auth.id || @request.auth.is_beekeeper = true",
    createRule: "@request.auth.is_beekeeper = true",
    updateRule: "@request.auth.is_beekeeper = true",
    deleteRule: "@request.auth.is_beekeeper = true",
    fields: [
      { name: "hive", type: "relation", required: true, maxSelect: 1, collectionId: hives.id },
      { name: "user", type: "relation", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
      { name: "role", type: "select", required: true, values: ["queen", "worker", "member"], maxSelect: 1 },
      { name: "status", type: "select", required: true, values: ["active", "invited", "suspended"], maxSelect: 1 },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_memberships_hive_user ON memberships (hive, user)"],
  });
  app.save(memberships);

  const hive = new Record(hives);
  hive.set("name", "Manta + Manabí");
  hive.set("slug", "manta-manabi");
  hive.set("status", "active");
  app.save(hive);
}, (app) => {
  for (const name of ["memberships", "hives", "users"]) {
    app.delete(app.findCollectionByNameOrId(name));
  }
});
