/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const listings = app.findCollectionByNameOrId("listings");
  if (!listings.fields.getByName("email")) listings.fields.add(new EmailField({ name: "email", max: 254 }));
  app.save(listings);
}, (app) => {
  const listings = app.findCollectionByNameOrId("listings");
  listings.fields.removeByName("email");
  app.save(listings);
});
