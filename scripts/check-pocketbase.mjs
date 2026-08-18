import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";

const require = createRequire(new URL("../web/package.json", import.meta.url));
const { default: PocketBase } = require("pocketbase");

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  assert.ok(value, `${name} is required`);
  return value;
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
  const superuserPassword = requiredEnv("PB_SUPERUSER_PASSWORD");
  const password = `PB-check-${randomUUID()}-Aa1!`;
  const email = `pb-check-${randomUUID()}@example.invalid`;
  const beekeeperEmail = `pb-check-${randomUUID()}@example.invalid`;

  const publicClient = new PocketBase(baseUrl);
  const adminClient = new PocketBase(baseUrl);
  const userClient = new PocketBase(baseUrl);
  let userId;

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
    if (userId && adminClient.authStore.isValid) {
      try {
        await adminClient.collection("users").delete(userId);
      } catch {
        console.warn("PocketBase security check cleanup failed");
      }
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
