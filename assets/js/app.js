/* BUG DROP — page chrome: responsive navigation and config-driven links. */
(function () {
  "use strict";

  var config = window.BUGDROP_CONFIG || {};
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    links.addEventListener("click", function (event) {
      if (event.target.tagName === "A" && links.classList.contains("is-open")) {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", function (event) {
      if (!links.classList.contains("is-open")) {
        return;
      }
      if (links.contains(event.target) || toggle.contains(event.target)) {
        return;
      }
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  }

  if (config.github) {
    var repoLinks = document.querySelectorAll("[data-github]");
    Array.prototype.forEach.call(repoLinks, function (node) {
      node.href = config.github;
    });
  }
})();
