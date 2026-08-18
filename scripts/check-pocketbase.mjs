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

function expectedRequestFailure(label) {
  return (error) => {
    assert.ok(error && typeof error === "object", `${label} returned an unexpected error`);
    assert.ok(Number.isInteger(error.status), `${label} did not return an HTTP error`);
    assert.ok(error.status >= 400 && error.status < 500, `${label} returned an unexpected HTTP status`);
    return true;
  };
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
      expectedRequestFailure("beekeeper registration"),
    );

    await assert.rejects(
      publicClient.collection("users").authWithPassword(email, password),
      expectedRequestFailure("unverified password login"),
    );

    await adminClient.collection("users").update(userId, { verified: true });

    await userClient.collection("users").authWithPassword(email, password);
    await assert.rejects(
      userClient.collection("users").update(userId, { is_beekeeper: true }),
      expectedRequestFailure("beekeeper privilege update"),
    );

    await userClient.collection("users").delete(userId);
    userId = undefined;
  } finally {
    if (userId && adminClient.authStore.isValid) {
      try {
        await adminClient.collection("users").delete(userId);
      } catch {
        // Cleanup is best effort; assertions above remain authoritative.
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
