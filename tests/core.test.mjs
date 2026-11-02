import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
require(path.join(root, "assets/js/core.js"));

const core = globalThis.BugDropCore;

test("core helpers are exposed for the browser and the test suite", () => {
  assert.ok(core, "BugDropCore global is missing");
  for (const name of [
    "parseCapsuleHash",
    "capsuleHref",
    "addUnique",
    "findCapsule",
    "tallyDomains",
    "progress"
  ]) {
    assert.equal(typeof core[name], "function", name + " is missing");
  }
});

test("parseCapsuleHash accepts capsule deep links only", () => {
  assert.equal(core.parseCapsuleHash("#capsule=c03"), "c03");
  assert.equal(core.parseCapsuleHash("#capsule=secret"), "secret");
  assert.equal(core.parseCapsuleHash("#capsule=c_01-x"), "c_01-x");
  assert.equal(core.parseCapsuleHash("#capsule=c03&x=1"), null);
  assert.equal(core.parseCapsuleHash("#projects"), null);
  assert.equal(core.parseCapsuleHash(""), null);
  assert.equal(core.parseCapsuleHash(null), null);
});

test("capsuleHref replaces any existing hash and encodes ids", () => {
  assert.equal(
    core.capsuleHref("https://example.com/portfolio#capsule=c01", "c02"),
    "https://example.com/portfolio#capsule=c02"
  );
  assert.equal(
    core.capsuleHref("https://example.com/portfolio", "secret"),
    "https://example.com/portfolio#capsule=secret"
  );
  assert.equal(core.capsuleHref("https://example.com/", ""), "");
  assert.equal(core.capsuleHref("https://example.com/", null), "");
});

test("addUnique keeps order, deduplicates, and ignores junk", () => {
  assert.deepEqual(core.addUnique([], "c01"), ["c01"]);
  assert.deepEqual(core.addUnique(["c01"], "c01"), ["c01"]);
  assert.deepEqual(core.addUnique(["c01"], "c02"), ["c01", "c02"]);
  assert.deepEqual(core.addUnique(["c01", 7, "", null], "c02"), [
    "c01",
    "c02"
  ]);
  assert.deepEqual(core.addUnique("nope", "c01"), ["c01"]);
  assert.deepEqual(core.addUnique(["c01"], ""), ["c01"]);
});

test("findCapsule resolves regular and secret capsules", () => {
  const data = {
    capsules: [{ id: "c01", superpower: "One" }],
    secret: { id: "secret", superpower: "Hidden" }
  };
  assert.equal(core.findCapsule(data, "c01").superpower, "One");
  assert.equal(core.findCapsule(data, "secret").superpower, "Hidden");
  assert.equal(core.findCapsule(data, "nope"), null);
  assert.equal(core.findCapsule(null, "c01"), null);
  assert.equal(core.findCapsule(data, ""), null);
});

test("progress clamps and reports whole percentages", () => {
  assert.deepEqual(core.progress(["c01", "c02", "c02"], 13), {
    unlocked: 2,
    total: 13,
    percent: 15
  });
  assert.deepEqual(core.progress([], 13), {
    unlocked: 0,
    total: 13,
    percent: 0
  });
  assert.deepEqual(core.progress([], 0), {
    unlocked: 0,
    total: 0,
    percent: 0
  });
  assert.deepEqual(core.progress(["a", "b", "c"], 2), {
    unlocked: 2,
    total: 2,
    percent: 100
  });
  assert.deepEqual(core.progress("nope", 4), {
    unlocked: 0,
    total: 4,
    percent: 0
  });
});

test("tallyDomains counts only unlocked capsules and sorts by count", () => {
  const list = [
    { id: "a", domain: "APIs" },
    { id: "b", domain: "APIs" },
    { id: "c", domain: "Data" },
    { id: "d" }
  ];
  assert.deepEqual(core.tallyDomains(list, ["a", "b"]), [
    { domain: "APIs", count: 2 }
  ]);
  assert.deepEqual(core.tallyDomains(list, ["a", "c", "d"]), [
    { domain: "APIs", count: 1 },
    { domain: "Data", count: 1 }
  ]);
  assert.deepEqual(core.tallyDomains(list, []), []);
  assert.deepEqual(core.tallyDomains("nope", ["a"]), []);
});
