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

  var config = window.BUGDROP_CONFIG || {};
  var redact = window.matchMedia("(prefers-reduced-motion: reduce)");
  var LS_PULLS = "bugdrop_pulls";
  var LS_SECRET = "bugdrop_secret";

  var machine = document.querySelector("[data-machine]");
  var lever = document.getElementById("lever");
  var drop = document.getElementById("capsule-drop");
  var counterEl = document.getElementById("pull-count");
  var statusEl = document.getElementById("machine-status");
  var reveal = document.getElementById("reveal");

  if (!machine || !lever || !reveal) {
    return;
  }

  var data = FALLBACK;
  var pulls = readNumber(LS_PULLS);
  var secretShown = readFlag(LS_SECRET);
  var busy = false;
  var lastIndex = -1;
  var lastFocus = null;

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

  function write(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (err) {
      /* storage can be unavailable in private mode; ignore */
    }
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
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
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

  reveal.addEventListener("click", function (event) {
    if (event.target.hasAttribute("data-close")) {
      closeReveal();
    }
  });

  document.addEventListener("keydown", onKeydown);

  loadCapsules().then(syncFromApi);
})();
