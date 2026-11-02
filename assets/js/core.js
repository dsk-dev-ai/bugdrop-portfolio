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

  function capsulesToMarkdown(capsules) {
    var list = Array.isArray(capsules)
      ? capsules.filter(function (capsule) {
          return capsule && capsule.id && capsule.superpower;
        })
      : [];
    if (!list.length) {
      return "";
    }

    var lines = ["# BUG DROP — unlocked capsules", ""];
    list.forEach(function (capsule) {
      lines.push("## " + capsule.superpower);
      lines.push("");
      if (capsule.domain) {
        lines.push("**Domain:** " + capsule.domain);
        lines.push("");
      }
      lines.push("- **Incident:** " + (capsule.bug || "—"));
      lines.push("- **Root cause:** " + (capsule.cause || "—"));
      lines.push("- **Fix:** " + (capsule.fix || "—"));
      lines.push("- **Lesson:** " + (capsule.lesson || "—"));
      lines.push("- **Built from it:** " + (capsule.project || "—"));
      if (capsule.evidence) {
        lines.push("- **Evidence:** " + capsule.evidence);
      }
      lines.push("");
    });
    return lines.join("\n").trim() + "\n";
  }

  function tallyDomains(capsules, unlocked) {
    var ids = Array.isArray(unlocked) ? unlocked : [];
    var counts = {};
    var list = Array.isArray(capsules) ? capsules : [];

    list.forEach(function (capsule) {
      if (!capsule || typeof capsule.domain !== "string" || capsule.domain === "") {
        return;
      }
      if (ids.indexOf(capsule.id) === -1) {
        return;
      }
      counts[capsule.domain] = (counts[capsule.domain] || 0) + 1;
    });

    return Object.keys(counts)
      .map(function (domain) {
        return { domain: domain, count: counts[domain] };
      })
      .sort(function (a, b) {
        return b.count - a.count || a.domain.localeCompare(b.domain);
      });
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
    capsulesToMarkdown: capsulesToMarkdown,
    tallyDomains: tallyDomains,
    progress: progress
  };
})(typeof window !== "undefined" ? window : globalThis);
