import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (file) =>
  JSON.parse(readFileSync(path.join(root, file), "utf8"));

const data = readJson("assets/js/capsules.json");
const REQUIRED_FIELDS = [
  "id",
  "superpower",
  "bug",
  "cause",
  "fix",
  "lesson",
  "project",
  "domain"
];

test("capsules dataset is well formed", () => {
  assert.ok(Array.isArray(data.capsules), "capsules must be an array");
  assert.ok(
    data.capsules.length >= 12,
    "expected at least 12 capsules, got " + data.capsules.length
  );

  for (const capsule of data.capsules) {
    for (const field of REQUIRED_FIELDS) {
      assert.equal(
        typeof capsule[field],
        "string",
        capsule.id + " is missing string field " + field
      );
      assert.ok(
        capsule[field].trim().length > 0,
        capsule.id + " has an empty " + field
      );
    }
  }

  const ids = data.capsules.map((capsule) => capsule.id);
  assert.equal(new Set(ids).size, ids.length, "capsule ids must be unique");
});

test("secret capsule is complete", () => {
  assert.ok(data.secret, "secret capsule is required");
  for (const field of REQUIRED_FIELDS) {
    assert.equal(
      typeof data.secret[field],
      "string",
      "secret capsule is missing " + field
    );
  }
});

test("capsule domains come from the documented set", () => {
  const allowed = new Set([
    "Debugging",
    "APIs",
    "Data",
    "Deploy",
    "Frontend",
    "Security",
    "Accessibility",
    "Mindset"
  ]);
  const all = data.capsules.concat(data.secret);
  for (const capsule of all) {
    assert.ok(
      allowed.has(capsule.domain),
      capsule.id + " has an unknown domain: " + capsule.domain
    );
  }
});

test("backend capsule mirror matches the frontend dataset", () => {
  const mirror = readJson("backend/src/capsules.json");
  assert.equal(mirror.length, data.capsules.length);
  assert.deepEqual(
    mirror.map((capsule) => capsule.id),
    data.capsules.map((capsule) => capsule.id)
  );
  assert.deepEqual(
    mirror.map((capsule) => capsule.superpower),
    data.capsules.map((capsule) => capsule.superpower)
  );
});

test("index.html contains the required sections and the visible hint", () => {
  const html = readFileSync(path.join(root, "index.html"), "utf8");
  for (const id of ["about", "skills", "projects", "aws", "machine"]) {
    assert.match(html, new RegExp('id="' + id + '"'), "missing #" + id);
  }
  assert.match(html, /PULL FOR A SUPERPOWER/, "missing visible hint text");
  assert.match(html, /role="dialog"/, "postmortem dialog is missing");
  assert.match(html, /aria-live="polite"/, "live region is missing");
});

test("every local asset referenced by index.html exists", () => {
  const html = readFileSync(path.join(root, "index.html"), "utf8");
  const refs = Array.from(
    html.matchAll(/(?:href|src)="([^"#:]+)"/g),
    (match) => match[1]
  ).filter((ref) => !ref.startsWith("http") && !ref.startsWith("mailto:"));

  for (const ref of refs) {
    assert.doesNotThrow(
      () => readFileSync(path.join(root, ref)),
      "missing local asset: " + ref
    );
  }
});
