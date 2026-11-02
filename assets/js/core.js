/* BUG DROP — pure helpers shared by the machine UI and the test suite.
 * Kept dependency-free so it runs in the browser and under node:test.
 */
(function (root) {
  "use strict";

  var CAPSULE_HASH = /^#capsule=([A-Za-z0-9_-]+)$/;

  function parseCapsuleHash(hash) {
    if (typeof hash !== "string") {
      return null;
    }
    var match = hash.match(CAPSULE_HASH);
    if (!match) {
      return null;
    }
    try {
      return decodeURIComponent(match[1]);
    } catch (err) {
      return null;
    }
  }

  function capsuleHref(href, id) {
    if (typeof id !== "string" || id === "") {
      return "";
    }
    var base = String(href || "").split("#")[0];
    return base + "#capsule=" + encodeURIComponent(id);
  }

  function addUnique(list, id) {
    var items = Array.isArray(list)
      ? list.filter(function (value) {
          return typeof value === "string" && value !== "";
        })
      : [];
    if (typeof id === "string" && id !== "" && items.indexOf(id) === -1) {
      items = items.concat(id);
    }
    return items;
  }

  function findCapsule(data, id) {
    if (!data || typeof id !== "string" || id === "") {
      return null;
    }
    var list = Array.isArray(data.capsules) ? data.capsules : [];
    for (var index = 0; index < list.length; index += 1) {
      if (list[index] && list[index].id === id) {
        return list[index];
      }
    }
    if (data.secret && data.secret.id === id) {
      return data.secret;
    }
    return null;
  }

  function progress(unlocked, total) {
    var seen = Array.isArray(unlocked) ? new Set(unlocked).size : 0;
    var max = Math.max(0, Number(total) || 0);
    var done = Math.min(seen, max);
    return {
      unlocked: done,
      total: max,
      percent: max === 0 ? 0 : Math.round((done / max) * 100)
    };
  }

  root.BugDropCore = {
    parseCapsuleHash: parseCapsuleHash,
    capsuleHref: capsuleHref,
    addUnique: addUnique,
    findCapsule: findCapsule,
    progress: progress
  };
})(typeof window !== "undefined" ? window : globalThis);
