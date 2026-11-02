/* BUG DROP — the Superpower Vending Machine.
 * Loads capsule stories, animates the machine, and reveals an
 * "incident postmortem" card. Works fully client-side; the optional
 * AWS counter is a progressive enhancement.
 */
(function () {
  "use strict";

  var FALLBACK = {
    capsules: [
      {
        id: "fallback-1",
        superpower: "The 2AM Debugger",
        bug: "The form did nothing and showed no error.",
        cause: "A typo in the request URL.",
        fix: "Logged the request and added error handling.",
        lesson: "Never trust the happy path.",
        project: "This portfolio",
        evidence: "local fallback"
      },
      {
        id: "fallback-2",
        superpower: "The CORS Whisperer",
        bug: "The API worked in Postman but not in the browser.",
        cause: "The API did not allow the site's origin.",
        fix: "Enabled CORS for the deployed origin only.",
        lesson: "The browser was protecting me, not failing me.",
        project: "Student API dashboard",
        evidence: "local fallback"
      }
    ],
    secret: {
      id: "secret",
      superpower: "The Unlocker",
      bug: "I almost quit after three failed deploys.",
      cause: "I treated failure as proof I could not do it.",
      fix: "Fixed one thing at a time and shipped.",
      lesson: "Persistence is a technical skill.",
      project: "This portfolio",
      evidence: "Secret capsule"
    }
  };

  var core = window.BugDropCore;
  var config = window.BUGDROP_CONFIG || {};
  var redact = window.matchMedia("(prefers-reduced-motion: reduce)");
  var LS_PULLS = "bugdrop_pulls";
  var LS_SECRET = "bugdrop_secret";
  var LS_UNLOCKED = "bugdrop_unlocked";

  var machine = document.querySelector("[data-machine]");
  var lever = document.getElementById("lever");
  var drop = document.getElementById("capsule-drop");
  var counterEl = document.getElementById("pull-count");
  var statusEl = document.getElementById("machine-status");
  var reveal = document.getElementById("reveal");
  var collectionList = document.getElementById("collection-list");
  var collectionCount = document.getElementById("collection-count");
  var collectionTotal = document.getElementById("collection-total");
  var collectionBar = document.getElementById("collection-bar");
  var collectionFill = document.getElementById("collection-fill");
  var copyButton = document.getElementById("copy-link");
  var copyStatus = document.getElementById("copy-status");
  var collectionComplete = document.getElementById("collection-complete");
  var profileList = document.getElementById("profile-list");
  var profileNote = document.getElementById("profile-note");

  if (!machine || !lever || !reveal || !core) {
    return;
  }

  var data = FALLBACK;
  var pulls = readNumber(LS_PULLS);
  var secretShown = readFlag(LS_SECRET);
  var unlocked = readList(LS_UNLOCKED);
  var busy = false;
  var lastIndex = -1;
  var lastFocus = null;
  var activeCapsuleId = null;
  var copyTimer = 0;
  var dailyEl = document.getElementById("daily-superpower");

  function readNumber(key) {
    try {
      return parseInt(window.localStorage.getItem(key) || "0", 10) || 0;
    } catch (err) {
      return 0;
    }
  }

  function readFlag(key) {
    try {
      return window.localStorage.getItem(key) === "1";
    } catch (err) {
      return false;
    }
  }

  function readList(key) {
    try {
      var raw = window.localStorage.getItem(key);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? parsed.filter(function (value) {
            return typeof value === "string" && value !== "";
          })
        : [];
    } catch (err) {
      return [];
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (err) {
      /* storage can be unavailable in private mode; ignore */
    }
  }

  function writeList(key, value) {
    write(key, JSON.stringify(value));
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function motion(ms) {
    return redact.matches ? 20 : ms;
  }

  function announce(message) {
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  function setCount(count) {
    if (!counterEl) {
      return;
    }
    if (typeof count !== "number" || count <= 0) {
      counterEl.hidden = true;
      return;
    }
    counterEl.hidden = false;
    counterEl.textContent = count + (count === 1 ? " capsule pulled" : " capsules pulled");
  }

  function pad2(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function collectionEntries() {
    var list = Array.isArray(data.capsules) ? data.capsules : [];
    var entries = list.map(function (capsule, index) {
      return {
        id: capsule.id,
        name: capsule.superpower,
        label: "Capsule " + pad2(index + 1),
        secret: false
      };
    });
    if (data.secret && data.secret.id) {
      entries.push({
        id: data.secret.id,
        name: data.secret.superpower,
        label: "Secret capsule",
        secret: true
      });
    }
    return entries;
  }

  function renderCollection() {
    if (
      !collectionList ||
      !collectionCount ||
      !collectionTotal ||
      !collectionBar ||
      !collectionFill
    ) {
      return;
    }

    var entries = collectionEntries();
    var state = core.progress(unlocked, entries.length);
    collectionCount.textContent = String(state.unlocked);
    collectionTotal.textContent = String(state.total);
    collectionBar.setAttribute("aria-valuemax", String(state.total));
    collectionBar.setAttribute("aria-valuenow", String(state.unlocked));
    collectionBar.setAttribute(
      "aria-valuetext",
      state.unlocked + " of " + state.total + " capsules collected"
    );
    collectionFill.style.width = state.percent + "%";
    if (collectionComplete) {
      collectionComplete.hidden = !(state.total > 0 && state.unlocked >= state.total);
    }

    collectionList.innerHTML = "";
    entries.forEach(function (entry) {
      var item = document.createElement("li");
      var open = unlocked.indexOf(entry.id) !== -1;
      var node;

      if (open) {
        node = document.createElement("button");
        node.type = "button";
        node.className = "collection-item is-unlocked";
        node.setAttribute("data-capsule-id", entry.id);
      } else {
        node = document.createElement("div");
        node.className = "collection-item is-locked";
      }

      var name = document.createElement("strong");
      name.textContent = open
        ? entry.name
        : entry.secret
          ? "Secret capsule"
          : entry.label;
      var meta = document.createElement("span");
      meta.textContent = open
        ? entry.label + " · open postmortem"
        : entry.secret
          ? "Locked · pull three times"
          : "Locked · pull the lever";

      node.appendChild(name);
      node.appendChild(meta);
      item.appendChild(node);
      collectionList.appendChild(item);
    });

    renderProfile();
  }

  function renderProfile() {
    if (!profileList) {
      return;
    }
    var all = Array.isArray(data.capsules) ? data.capsules.slice() : [];
    if (data.secret) {
      all.push(data.secret);
    }
    var tally = core.tallyDomains(all, unlocked);
    profileList.innerHTML = "";

    if (!tally.length) {
      if (profileNote) {
        profileNote.hidden = false;
      }
      return;
    }
    if (profileNote) {
      profileNote.hidden = true;
    }

    var max = tally[0].count;
    tally.forEach(function (item) {
      var row = document.createElement("li");
      row.className = "profile-row";

      var label = document.createElement("span");
      label.className = "profile-label";
      label.textContent = item.domain;

      var track = document.createElement("span");
      track.className = "profile-track";
      track.setAttribute("aria-hidden", "true");
      var fill = document.createElement("span");
      fill.className = "profile-fill";
      fill.style.width = Math.round((item.count / max) * 100) + "%";
      track.appendChild(fill);

      var count = document.createElement("span");
      count.className = "profile-count";
      count.textContent = item.count + (item.count === 1 ? " capsule" : " capsules");

      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(count);
      profileList.appendChild(row);
    });
  }

  function unlockCapsule(id) {
    var next = core.addUnique(unlocked, id);
    if (next.length !== unlocked.length) {
      unlocked = next;
      writeList(LS_UNLOCKED, unlocked);
    }
    renderCollection();
  }

  function openById(id) {
    var capsule = core.findCapsule(data, id);
    if (!capsule) {
      return false;
    }
    openReveal({
      capsule: capsule,
      isSecret: Boolean(data.secret && capsule.id === data.secret.id)
    });
    return true;
  }

  function setCapsuleHash(id) {
    try {
      var next = core.capsuleHref(window.location.href, id);
      if (next && window.history && window.history.replaceState) {
        window.history.replaceState(null, "", next);
      }
    } catch (err) {
      /* history can be restricted in embedded views; ignore */
    }
  }

  function clearCapsuleHash() {
    try {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      }
    } catch (err) {
      /* ignore */
    }
  }

  function openFromHash() {
    var id = core.parseCapsuleHash(window.location.hash);
    return id ? openById(id) : false;
  }

  function loadCapsules() {
    return window
      .fetch("assets/js/capsules.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("capsules.json " + response.status);
        }
        return response.json();
      })
      .then(function (payload) {
        if (payload && Array.isArray(payload.capsules) && payload.capsules.length) {
          data = payload;
        }
      })
      .catch(function () {
        data = FALLBACK;
      });
  }

  function syncFromApi() {
    if (!config.apiBase) {
      setCount(pulls);
      return;
    }
    window
      .fetch(config.apiBase + "/stats", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("stats " + response.status);
        }
        return response.json();
      })
      .then(function (payload) {
        setCount(Number(payload.count) || 0);
      })
      .catch(function () {
        setCount(pulls);
      });
  }

  function registerPull() {
    pulls += 1;
    write(LS_PULLS, pulls);
    setCount(pulls);

    if (!config.apiBase) {
      return Promise.resolve();
    }

    return window
      .fetch(config.apiBase + "/pull", { method: "POST" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("pull " + response.status);
        }
        return response.json();
      })
      .then(function (payload) {
        setCount(Number(payload.count) || pulls);
      })
      .catch(function () {
        setCount(pulls);
      });
  }

  function pickCapsule() {
    if (!data.secret) {
      return pickFrom(data.capsules);
    }
    if (pulls >= 3 && !secretShown) {
      secretShown = true;
      write(LS_SECRET, 1);
      return { capsule: data.secret, isSecret: true };
    }
    return { capsule: pickFrom(data.capsules), isSecret: false };
  }

  function pickFrom(list) {
    if (!Array.isArray(list) || list.length === 0) {
      return FALLBACK.capsules[0];
    }
    if (list.length === 1) {
      return list[0];
    }
    var index = Math.floor(Math.random() * list.length);
    if (index === lastIndex) {
      index = (index + 1) % list.length;
    }
    lastIndex = index;
    return list[index];
  }

  function fill(id, value) {
    var node = document.getElementById(id);
    if (node) {
      node.textContent = value || "—";
    }
  }

  function openReveal(result) {
    lastFocus = document.activeElement;
    var capsule = result.capsule;
    activeCapsuleId = capsule.id;
    unlockCapsule(capsule.id);
    setCapsuleHash(capsule.id);
    if (copyStatus) {
      copyStatus.textContent = "";
    }

    fill("reveal-title", capsule.superpower);
    fill("reveal-bug", capsule.bug);
    fill("reveal-cause", capsule.cause);
    fill("reveal-fix", capsule.fix);
    fill("reveal-lesson", capsule.lesson);
    fill("reveal-project", capsule.project);

    var kicker = document.getElementById("reveal-kicker");
    if (kicker) {
      kicker.textContent = result.isSecret ? "SECRET CAPSULE UNLOCKED" : "INCIDENT POSTMORTEM";
    }

    reveal.hidden = false;
    document.body.style.overflow = "hidden";
    announce("Capsule opened: " + capsule.superpower);

    var closeButton = reveal.querySelector(".reveal-close");
    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeReveal() {
    reveal.hidden = true;
    activeCapsuleId = null;
    document.body.style.overflow = "";
    clearCapsuleHash();
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function fallbackCopy(text) {
    try {
      var field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      var copied = document.execCommand("copy");
      document.body.removeChild(field);
      return copied;
    } catch (err) {
      return false;
    }
  }

  function setCopyStatus(message) {
    if (!copyStatus) {
      return;
    }
    copyStatus.textContent = message;
    if (copyTimer) {
      window.clearTimeout(copyTimer);
    }
    copyTimer = window.setTimeout(function () {
      copyStatus.textContent = "";
    }, 3200);
  }

  function copyActiveLink() {
    if (!activeCapsuleId) {
      return;
    }
    var url = core.capsuleHref(window.location.href, activeCapsuleId);

    function done(copied) {
      if (copied) {
        setCopyStatus("Link copied — share this capsule");
        announce("Link copied to clipboard");
      } else {
        setCopyStatus("Copy failed — use the address bar");
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () {
          done(true);
        },
        function () {
          done(fallbackCopy(url));
        }
      );
    } else {
      done(fallbackCopy(url));
    }
  }

  function onKeydown(event) {
    if (reveal.hidden) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeReveal();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }
    var focusable = reveal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) {
      return;
    }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function pull() {
    if (busy) {
      return;
    }
    busy = true;
    lever.disabled = true;
    lever.classList.add("is-pulled");
    machine.classList.add("is-shaking");
    announce("Pulling the lever…");

    wait(motion(520))
      .then(function () {
        machine.classList.remove("is-shaking");
        machine.classList.add("is-dropping");
        if (drop) {
          drop.setAttribute("aria-hidden", "false");
        }
        announce("A capsule is dropping…");
        return wait(motion(420));
      })
      .then(function () {
        return registerPull();
      })
      .then(function () {
        return wait(motion(160));
      })
      .then(function () {
        var result = pickCapsule();
        machine.classList.remove("is-dropping");
        if (drop) {
          drop.setAttribute("aria-hidden", "true");
        }
        openReveal(result);
      })
      .finally(function () {
        lever.classList.remove("is-pulled");
        lever.disabled = false;
        busy = false;
      });
  }

  lever.addEventListener("click", pull);

  var pullCta = document.getElementById("pull-cta");
  if (pullCta) {
    pullCta.addEventListener("click", functionsPull);
  }

  function functionsPull() {
    var target = document.getElementById("top");
    if (target) {
      target.scrollIntoView({ behavior: redact.matches ? "auto" : "smooth", block: "start" });
    }
    pull();
  }

  var pullAgain = document.getElementById("pull-again");
  if (pullAgain) {
    pullAgain.addEventListener("click", function () {
      closeReveal();
      pull();
    });
  }

  if (copyButton) {
    copyButton.addEventListener("click", copyActiveLink);
  }

  if (collectionList) {
    collectionList.addEventListener("click", function (event) {
      var target = event.target.closest("[data-capsule-id]");
      if (target) {
        openById(target.getAttribute("data-capsule-id"));
      }
    });
  }

  window.addEventListener("hashchange", function () {
    var id = core.parseCapsuleHash(window.location.hash);
    if (id) {
      openById(id);
      return;
    }
    if (!reveal.hidden) {
      closeReveal();
    }
  });

  reveal.addEventListener("click", function (event) {
    if (event.target.hasAttribute("data-close")) {
      closeReveal();
    }
  });

  document.addEventListener("keydown", onKeydown);

  function localDaily() {
    var list = data && data.capsules ? data.capsules : FALLBACK.capsules;
    var now = new Date();
    var start = Date.UTC(now.getUTCFullYear(), 0, 0);
    var doy = Math.floor((now.getTime() - start) / 86400000);
    return list[doy % list.length];
  }

  function setDaily(name) {
    if (dailyEl) {
      dailyEl.textContent = name || "—";
    }
  }

  function loadDaily() {
    setDaily(localDaily().superpower);
    if (!config.apiBase) {
      return;
    }
    window
      .fetch(config.apiBase + "/daily", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("daily " + response.status);
        }
        return response.json();
      })
      .then(function (payload) {
        if (payload && payload.superpower) {
          setDaily(payload.superpower);
        }
      })
      .catch(function () {
        /* keep the deterministic local value */
      });
  }

  loadCapsules().then(function () {
    renderCollection();
    openFromHash();
    syncFromApi();
    loadDaily();
  });
})();
