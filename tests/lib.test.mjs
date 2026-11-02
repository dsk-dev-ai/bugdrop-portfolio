import test from "node:test";
import assert from "node:assert/strict";
import {
  dayOfYear,
  dailyCapsule,
  reply,
  routeOf
} from "../backend/src/lib.mjs";

const capsules = [
  { id: "c01", superpower: "The 2AM Debugger" },
  { id: "c02", superpower: "The CORS Whisperer" },
  { id: "c03", superpower: "The Off-By-One Slayer" }
];

test("dayOfYear counts from 1 on January 1", () => {
  assert.equal(dayOfYear(new Date("2026-01-01T00:00:00Z")), 1);
});

test("dayOfYear is 365 at the end of a non-leap year", () => {
  assert.equal(dayOfYear(new Date("2026-12-31T23:59:59Z")), 365);
});

test("dayOfYear is 366 at the end of a leap year", () => {
  assert.equal(dayOfYear(new Date("2024-12-31T12:00:00Z")), 366);
});

test("dailyCapsule is deterministic for the same date", () => {
  const date = new Date("2026-11-03T09:00:00Z");
  assert.deepEqual(dailyCapsule(capsules, date), dailyCapsule(capsules, date));
});

test("dailyCapsule rotates through the list by day", () => {
  const first = dailyCapsule(capsules, new Date("2026-01-01T00:00:00Z"));
  const second = dailyCapsule(capsules, new Date("2026-01-02T00:00:00Z"));
  assert.notEqual(first.id, second.id);
  assert.equal(first.date, "2026-01-01");
});

test("dailyCapsule rejects an empty dataset", () => {
  assert.throws(() => dailyCapsule([], new Date()), /non-empty/);
});

test("dailyCapsule rejects malformed entries", () => {
  assert.throws(
    () => dailyCapsule([{ id: "x" }], new Date("2026-01-01T00:00:00Z")),
    /malformed/
  );
});

test("routeOf understands HTTP API v2 events", () => {
  const route = routeOf({
    requestContext: { http: { method: "POST", path: "/pull" } }
  });
  assert.deepEqual(route, { method: "POST", path: "/pull" });
});

test("routeOf falls back to REST API fields", () => {
  const route = routeOf({ httpMethod: "GET", path: "/stats" });
  assert.deepEqual(route, { method: "GET", path: "/stats" });
});

test("routeOf is defensive with an empty event", () => {
  assert.deepEqual(routeOf({}), { method: "GET", path: "/" });
});

test("reply serializes JSON with no-store caching", () => {
  const response = reply(200, { count: 7 });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["cache-control"], "no-store");
  assert.deepEqual(JSON.parse(response.body), { count: 7 });
});
