/**
 * Ensures legal/email/cookie links in footers and wires "Cookie settings".
 */
(function () {
  if (window.__saaniyaLegalFooter) return;
  window.__saaniyaLegalFooter = true;

  var LEGAL = [
    { href: "/unsubscribe.html", text: "Email preferences", match: /unsubscribe/i },
    { href: "/cookies.html", text: "Cookie Policy", match: /cookies\.html|\/cookies/i },
    { href: "#", text: "Cookie settings", match: /cookie settings/i, className: "saaniya-cookie-settings-link" },
  ];

  function prefixForPage() {
    var path = (window.location && window.location.pathname) || "";
    if (path.indexOf("/legal/") !== -1 || path.indexOf("/privacy/") !== -1) return "../";
    return "";
  }

  function ensureAnchor(parent, spec) {
    if (!parent) return;
    var existing = parent.querySelectorAll("a, button");
    for (var i = 0; i < existing.length; i++) {
      if (spec.match.test(existing[i].textContent || "") || spec.match.test(existing[i].getAttribute("href") || "")) {
        return;
      }
    }
    var el = document.createElement("a");
    if (spec.href.startsWith("#")) {
      el.href = spec.href;
    } else if (spec.href.startsWith("/")) {
      el.href = prefixForPage() + spec.href.slice(1);
    } else {
      el.href = spec.href;
    }
    el.textContent = spec.text;
    if (spec.className) el.className = spec.className;
    parent.appendChild(el);
  }

  function patchFooterLinks() {
    document.querySelectorAll(".footer-links").forEach(function (row) {
      LEGAL.forEach(function (spec) {
        ensureAnchor(row, spec);
      });
    });

    document.querySelectorAll(".site-footer__bar").forEach(function (bar) {
      [" · ", " | "].forEach(function () {
        /* inline bar style */
      });
      LEGAL.forEach(function (spec) {
        if (spec.className) return;
        var found = false;
        bar.querySelectorAll("a").forEach(function (a) {
          if (spec.match.test(a.getAttribute("href") || "") || spec.match.test(a.textContent)) found = true;
        });
        if (found) return;
        var sep = document.createTextNode(" · ");
        var a = document.createElement("a");
        a.href = prefixForPage() + spec.href.replace(/^\//, "");
        a.textContent = spec.text;
        bar.appendChild(sep);
        bar.appendChild(a);
      });
      if (!bar.querySelector(".saaniya-cookie-settings-link")) {
        bar.appendChild(document.createTextNode(" · "));
        var btn = document.createElement("a");
        btn.href = "#";
        btn.className = "saaniya-cookie-settings-link";
        btn.textContent = "Cookie settings";
        bar.appendChild(btn);
      }
    });

    document.querySelectorAll(".site-footer__col").forEach(function (col) {
      var title = col.querySelector(".site-footer__col-title");
      if (!title || !/company/i.test(title.textContent)) return;
      LEGAL.forEach(function (spec) {
        ensureAnchor(col, spec);
      });
    });
  }

  function wireCookieSettings() {
    document.addEventListener("click", function (event) {
      var link = event.target.closest(".saaniya-cookie-settings-link");
      if (!link) return;
      event.preventDefault();
      if (typeof window.saaniyaOpenCookiePreferences === "function") {
        window.saaniyaOpenCookiePreferences();
      } else {
        window.location.href = (prefixForPage() || "") + "cookies.html#preferences";
      }
    });
  }

  function patchEmrNav() {
    document.querySelectorAll('nav.site-nav, nav.site-nav[aria-label="Primary"]').forEach(function (nav) {
      if (nav.dataset.legalPatched === "1") return;
      var prefix = prefixForPage();
      [
        { href: prefix + "unsubscribe.html", text: "Email preferences", match: /unsubscribe/i },
        { href: prefix + "cookies.html", text: "Cookies", match: /cookies\.html/i },
      ].forEach(function (spec) {
        var found = false;
        nav.querySelectorAll("a").forEach(function (a) {
          if (spec.match.test(a.getAttribute("href") || "")) found = true;
        });
        if (found) return;
        var a = document.createElement("a");
        a.href = spec.href;
        a.textContent = spec.text;
        var company = nav.querySelector(".nav-company");
        if (company) nav.insertBefore(a, company);
        else nav.appendChild(a);
      });
      nav.dataset.legalPatched = "1";
    });
  }

  function injectLegalNav() {
    var navLinks = document.getElementById("navLinks");
    if (!navLinks || document.getElementById("saaniyaLegalNav")) return;
    var li = document.createElement("li");
    li.className = "nav-dropdown";
    li.id = "saaniyaLegalNav";
    li.innerHTML =
      '<a href="privacy.html">Legal</a>' +
      '<div class="dropdown-menu">' +
      '<a href="privacy.html">Privacy Policy</a>' +
      '<a href="terms.html">Terms</a>' +
      '<a href="disclaimer.html">Disclaimer</a>' +
      '<a href="cookies.html">Cookie Policy</a>' +
      '<a href="unsubscribe.html">Email preferences</a>' +
      '<a href="#" class="saaniya-cookie-settings-link">Cookie settings</a>' +
      '<a href="email-updates.html">Email updates</a>' +
      "</div>";
    navLinks.appendChild(li);
    var trigger = li.querySelector("a");
    var menu = li.querySelector(".dropdown-menu");
    if (trigger && menu) {
      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        li.classList.toggle("open");
        menu.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", li.classList.contains("open") ? "true" : "false");
      });
    }
  }

  function init() {
    patchFooterLinks();
    wireCookieSettings();
    patchEmrNav();
    injectLegalNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();