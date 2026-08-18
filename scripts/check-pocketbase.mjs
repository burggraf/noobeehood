import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";

const require = createRequire(new URL("../web/package.json", import.meta.url));
const { default: PocketBase } = require("pocketbase");

function requiredEnv(name, { trim = true } = {}) {
  const value = process.env[name];
  const normalized = trim ? value?.trim() : value;
  assert.ok(normalized, `${name} is required`);
  return normalized;
}

function pocketBaseUrl() {
  const value = requiredEnv("PUBLIC_POCKETBASE_URL");
  let url;
  try {
    url = new URL(value);
  } catch {
    assert.fail("PUBLIC_POCKETBASE_URL must be a valid HTTP(S) URL");
  }
  assert.ok(["http:", "https:"].includes(url.protocol), "PUBLIC_POCKETBASE_URL must use HTTP(S)");
  return url.toString().replace(/\/$/, "");
}

async function run() {
  const baseUrl = pocketBaseUrl();
  const superuserEmail = requiredEnv("PB_SUPERUSER_EMAIL");
  const superuserPassword = requiredEnv("PB_SUPERUSER_PASSWORD", { trim: false });
  const password = `PB-check-${randomUUID()}-Aa1!`;
  const email = `pb-check-${randomUUID()}@example.invalid`;
  const beekeeperEmail = `pb-check-${randomUUID()}@example.invalid`;
  const listingSlugPrefix = `pb-check-${randomUUID()}`;
  const inactiveHiveSlug = `${listingSlugPrefix}-inactive-hive`;

  const publicClient = new PocketBase(baseUrl);
  const adminClient = new PocketBase(baseUrl);
  const userClient = new PocketBase(baseUrl);
  const beekeeperClient = new PocketBase(baseUrl);
  const listingIds = new Set();
  let userId;
  let inactiveHiveId;

  try {
    const hive = await publicClient.collection("hives").getFirstListItem(
      'slug = "manta-manabi" && status = "active"',
    );
    assert.equal(hive.name, "Manta + Manabí");

    await adminClient.collection("_superusers").authWithPassword(superuserEmail, superuserPassword);

    const user = await publicClient.collection("users").create({
      email,
      password,
      passwordConfirm: password,
      name: "PocketBase security check",
    });
    userId = user.id;
    assert.equal(user.is_beekeeper, false);
    assert.equal(user.verified, false);

    await assert.rejects(
      publicClient.collection("users").create({
        email: beekeeperEmail,
        password,
        passwordConfirm: password,
        name: "PocketBase security check",
        is_beekeeper: true,
      }),
      (error) => {
        assert.equal(error?.status, 400, "beekeeper registration should return HTTP 400");
        return true;
      },
    );

    await assert.rejects(
      publicClient.collection("users").authWithPassword(email, password),
      (error) => {
        assert.equal(error?.status, 403, "unverified password login should return HTTP 403");
        return true;
      },
    );

    const verifiedUser = await adminClient.collection("users").update(userId, { verified: true });
    assert.equal(verifiedUser.id, userId);
    assert.equal(verifiedUser.verified, true);

    await userClient.collection("users").authWithPassword(email, password);
    await assert.rejects(
      userClient.collection("users").update(userId, { is_beekeeper: true }),
      (error) => {
        assert.equal(error?.status, 404, "beekeeper privilege update should return HTTP 404");
        return true;
      },
    );

    const beekeeperUser = await adminClient.collection("users").create({
      email: beekeeperEmail,
      password,
      passwordConfirm: password,
      name: "PocketBase beekeeper security check",
      verified: true,
      is_beekeeper: true,
    });
    assert.equal(beekeeperUser.verified, true);
    assert.equal(beekeeperUser.is_beekeeper, true);
    await beekeeperClient.collection("users").authWithPassword(beekeeperEmail, password);

    const inactiveHive = await adminClient.collection("hives").create({
      name: "PocketBase security check inactive hive",
      slug: inactiveHiveSlug,
      status: "inactive",
    });
    inactiveHiveId = inactiveHive.id;

    const validListing = (hive, slug, status = "published") => ({
      hive,
      name: `PocketBase security check ${slug}`,
      slug,
      category: "food-shopping-dining",
      listing_type: "security fixture",
      summary: "Synthetic listing used only by the PocketBase security check.",
      location: "Manta",
      search_terms: "synthetic fixture",
      website: "https://example.invalid/listing",
      phone: "+593 000 000 000",
      source_url: "https://example.invalid/source",
      verification_method: "editor_checked",
      last_verified_at: "2026-08-18 00:00:00.000Z",
      status,
    });

    const publishedListing = await adminClient.collection("listings").create(
      validListing(hive.id, `${listingSlugPrefix}-published`),
    );
    listingIds.add(publishedListing.id);
    const draftListing = await adminClient.collection("listings").create(
      validListing(hive.id, `${listingSlugPrefix}-draft`, "draft"),
    );
    listingIds.add(draftListing.id);
    const archivedListing = await adminClient.collection("listings").create(
      validListing(hive.id, `${listingSlugPrefix}-archived`, "archived"),
    );
    listingIds.add(archivedListing.id);
    const inactiveListing = await adminClient.collection("listings").create(
      validListing(inactiveHive.id, `${listingSlugPrefix}-inactive`, "published"),
    );
    listingIds.add(inactiveListing.id);

    const publicListings = await publicClient.collection("listings").getList(1, 50, {
      filter: publicClient.filter("hive = {:hive} && slug = {:slug}", {
        hive: hive.id,
        slug: publishedListing.slug,
      }),
    });
    assert.deepEqual(publicListings.items.map((record) => record.id), [publishedListing.id]);
    assert.equal((await publicClient.collection("listings").getOne(publishedListing.id)).id, publishedListing.id);
    for (const hiddenListing of [draftListing, archivedListing, inactiveListing]) {
      await assert.rejects(
        publicClient.collection("listings").getOne(hiddenListing.id),
        (error) => error?.status === 404,
      );
    }

    await assert.rejects(
      userClient.collection("listings").create(validListing(hive.id, `${listingSlugPrefix}-regular-user`)),
    );
    await assert.rejects(
      userClient.collection("listings").update(publishedListing.id, { name: "Changed" }),
    );
    await assert.rejects(userClient.collection("listings").delete(publishedListing.id));

    await assert.rejects(
      adminClient.collection("listings").create(
        validListing(hive.id, publishedListing.slug),
      ),
      (error) => error?.status === 400,
    );

    const beekeeperListing = await beekeeperClient.collection("listings").create(
      validListing(hive.id, `${listingSlugPrefix}-beekeeper`, "draft"),
    );
    listingIds.add(beekeeperListing.id);
    const updatedBeekeeperListing = await beekeeperClient.collection("listings").update(
      beekeeperListing.id,
      { name: "Updated by verified beekeeper" },
    );
    assert.equal(updatedBeekeeperListing.name, "Updated by verified beekeeper");
    await beekeeperClient.collection("listings").delete(beekeeperListing.id);

    await userClient.collection("users").delete(userId);
    await assert.rejects(
      adminClient.collection("users").getOne(userId),
      (error) => {
        assert.equal(error?.status, 404, "deleted user lookup should return HTTP 404");
        return true;
      },
    );
    userId = undefined;
  } finally {
    if (adminClient.authStore.isValid) {
      let cleanupFailed = false;
      for (const listingId of listingIds) {
        try {
          await adminClient.collection("listings").delete(listingId);
        } catch (error) {
          if (error?.status !== 404) cleanupFailed = true;
        }
      }
      if (inactiveHiveId) {
        try {
          await adminClient.collection("hives").delete(inactiveHiveId);
        } catch (error) {
          if (error?.status !== 404) cleanupFailed = true;
        }
      }
      for (const testEmail of [email, beekeeperEmail]) {
        let records;
        try {
          records = await adminClient.collection("users").getList(1, 50, {
            filter: adminClient.filter("email = {:email}", { email: testEmail }),
          });
        } catch {
          cleanupFailed = true;
          continue;
        }
        for (const record of records.items) {
          try {
            await adminClient.collection("users").delete(record.id);
          } catch (error) {
            if (error?.status !== 404) cleanupFailed = true;
          }
        }
      }
      if (cleanupFailed) throw new Error("PocketBase security check cleanup failed");
    }
  }
}

run()
  .then(() => {
    console.log("PocketBase security checks passed");
  })
  .catch(() => {
    console.error("PocketBase security checks failed");
    process.exitCode = 1;
  });
