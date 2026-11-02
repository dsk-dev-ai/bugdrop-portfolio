import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");
const html = read("index.html");

const metaTags = Array.from(html.matchAll(/<meta\b[^>]*>/g), (m) => m[0]);
const metaContent = (attr, name) => {
  const tag = metaTags.find((candidate) =>
    candidate.includes(attr + '="' + name + '"')
  );
  const content = tag?.match(/content="([^"]*)"/);
  return content ? content[1] : null;
};

const pngSize = (file) => {
  const buffer = readFileSync(path.join(root, file));
  assert.equal(buffer.toString("ascii", 1, 4), "PNG", file + " is not a PNG");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
};

test("page has a descriptive title, description, and canonical metadata", () => {
  assert.match(html, /<title>[^<]{10,70}<\/title>/);
  const description = metaContent("name", "description");
  assert.ok(description, "meta description is missing");
  assert.ok(description.length >= 50 && description.length <= 160);
  assert.equal(metaContent("property", "og:type"), "website");
  assert.ok(metaContent("property", "og:title"));
  assert.ok(metaContent("property", "og:description"));
  assert.ok(metaContent("name", "twitter:card"));
  assert.equal(metaContent("name", "theme-color"), "#0b0f14");
});

test("social cover is a real 1200x675 PNG", () => {
  assert.equal(metaContent("property", "og:image"), "assets/img/og-cover.png");
  assert.equal(metaContent("name", "twitter:image"), "assets/img/og-cover.png");
  assert.deepEqual(pngSize("assets/img/og-cover.png"), {
    width: 1200,
    height: 675
  });
  assert.equal(metaContent("property", "og:image:width"), "1200");
  assert.equal(metaContent("property", "og:image:height"), "675");
  assert.ok(metaContent("property", "og:image:alt"));
  assert.ok(existsSync(path.join(root, "assets/img/og-cover.svg")));
});

test("web app manifest is linked, valid, and its icons exist", () => {
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#0b0f14");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);

  for (const icon of manifest.icons) {
    assert.ok(existsSync(path.join(root, icon.src)), "missing icon " + icon.src);
    assert.ok(icon.sizes && icon.type, "icon metadata is incomplete");
  }

  const pngIcon = manifest.icons.find((icon) => icon.type === "image/png");
  assert.deepEqual(pngSize(pngIcon.src), { width: 512, height: 512 });
  assert.match(html, /rel="apple-touch-icon" href="assets\/img\/icon-512\.png"/);
});

test("capsule cabinet and share controls are wired into the page", () => {
  for (const id of [
    "collection-title",
    "collection-count",
    "collection-total",
    "collection-bar",
    "collection-fill",
    "collection-list",
    "collection-complete",
    "profile-title",
    "profile-list",
    "profile-note",
    "export-cabinet",
    "reset-cabinet",
    "copy-link",
    "copy-status"
  ]) {
    assert.match(html, new RegExp('id="' + id + '"'), "missing #" + id);
  }
  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-valuenow="0"/);
  assert.match(html, /id="copy-link"[^>]*>Copy link</);

  const coreIdx = html.indexOf("assets/js/core.js");
  const machineIdx = html.indexOf("assets/js/machine.js");
  assert.ok(coreIdx !== -1 && machineIdx !== -1 && coreIdx < machineIdx);

  const machine = read("assets/js/machine.js");
  assert.match(machine, /bugdrop_unlocked/);
  assert.match(machine, /parseCapsuleHash/);
  assert.match(machine, /capsuleHref/);
  assert.match(machine, /navigator\.clipboard/);
  assert.match(machine, /text\/markdown/);
  assert.match(machine, /capsulesToMarkdown/);
});

test("AWS section documents the live architecture and links the source", () => {
  assert.match(html, /id="aws"/);
  assert.match(html, /src="docs\/architecture\.svg"/);
  for (const service of [
    "AWS Amplify Hosting",
    "Amazon CloudFront",
    "API Gateway",
    "AWS Lambda",
    "Amazon DynamoDB",
    "CloudWatch",
    "AWS Budgets"
  ]) {
    assert.match(html, new RegExp(service), "missing AWS service: " + service);
  }
  assert.match(html, /backend\/template\.yaml/);
  assert.match(html, /docs\/DEPLOY\.md/);
  assert.match(html, /href="#aws"/);
});

test("custom 404 page exists and routes back to the machine", () => {
  assert.ok(existsSync(path.join(root, "404.html")));
  const notFound = read("404.html");
  assert.match(notFound, /<meta name="robots" content="noindex">/);
  assert.match(notFound, /href="\/"/);
  assert.match(notFound, /href="assets\/css\/style\.css"/);
});

test("runtime config is deploy-ready and has no placeholders", () => {
  const config = read("assets/js/config.js");
  assert.match(config, /github:\s*"https:\/\/github\.com\/dsk-dev-ai"/u);
  assert.match(config, /apiBase:\s*("[^"]*"|'[^']*')/u);
  assert.doesNotMatch(config, /YOUR_|PLACEHOLDER|xxxxxxxx/i);

  for (const file of ["index.html", "manifest.webmanifest", "assets/js/config.js"]) {
    assert.doesNotMatch(
      read(file),
      /YOUR_AMPLIFY_ID|localhost:8080/,
      file + " still contains a placeholder"
    );
  }
});

test("deploy runbook covers the required evidence", () => {
  const runbook = read("docs/DEPLOY.md");
  for (const needle of [
    "Amplify Hosting",
    "AllowedOrigin",
    "sam deploy",
    "docs/screenshots",
    "November 6",
    "Troubleshooting"
  ]) {
    assert.match(runbook, new RegExp(needle.replace(".", "\\.")), needle);
  }
});
