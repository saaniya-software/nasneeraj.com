/**
 * Saaniya cookie + GPC consent (canonical).
 * localStorage: saaniya-cookie-consent = "essential" | "all"
 * GPC on => force essential; do not load analytics.
 */
(function () {
  if (window.__saaniyaCookieConsent) return;
  window.__saaniyaCookieConsent = true;

  var KEY = "saaniya-cookie-consent";
  var VERSION = "20261125";

  function gpcOn() {
    try {
      return navigator.globalPrivacyControl === true;
    } catch (e) {
      return false;
    }
  }

  function read() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function write(value) {
    try {
      localStorage.setItem(KEY, value);
      localStorage.setItem(KEY + "-v", VERSION);
    } catch (e) {
      /* private mode */
    }
  }

  function allowAnalytics() {
    if (gpcOn()) return false;
    return read() === "all";
  }

  window.saaniyaAllowAnalytics = allowAnalytics;

  var analyticsLoaded = false;
  function loadAnalyticsIfAllowed() {
    if (!allowAnalytics() || analyticsLoaded) return;
    analyticsLoaded = true;
    window.va = window.va || function () {
      (window.vaq = window.vaq || []).push(arguments);
    };
    var s = document.createElement("script");
    s.defer = true;
    s.src = "/_vercel/insights/script.js";
    document.head.appendChild(s);
  }

  window.saaniyaSetCookieConsent = function (value) {
    if (value !== "essential" && value !== "all") return;
    if (gpcOn()) value = "essential";
    write(value);
    if (value === "all") loadAnalyticsIfAllowed();
    window.dispatchEvent(new CustomEvent("saaniya-cookie-consent", { detail: value }));
    var banner = document.getElementById("saaniya-cookie-banner");
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
  };

  function injectStyles() {
    if (document.getElementById("saaniya-cookie-styles")) return;
    var style = document.createElement("style");
    style.id = "saaniya-cookie-styles";
    style.textContent =
      "#saaniya-cookie-banner{position:fixed;z-index:99999;left:0;right:0;bottom:0;" +
      "background:#0f172a;color:#e2e8f0;padding:14px 18px;font:14px/1.45 system-ui,Segoe UI,sans-serif;" +
      "box-shadow:0 -4px 24px rgba(0,0,0,.25);display:flex;flex-wrap:wrap;gap:12px;align-items:center;" +
      "justify-content:space-between}" +
      "#saaniya-cookie-banner p{margin:0;max-width:48rem;flex:1 1 16rem}" +
      "#saaniya-cookie-banner a{color:#93c5fd}" +
      "#saaniya-cookie-banner .saaniya-cookie-actions{display:flex;flex-wrap:wrap;gap:8px}" +
      "#saaniya-cookie-banner button{cursor:pointer;border:0;border-radius:6px;padding:8px 14px;font-weight:600}" +
      "#saaniya-cookie-banner .saaniya-cookie-essential{background:#334155;color:#fff}" +
      "#saaniya-cookie-banner .saaniya-cookie-all{background:#6366f1;color:#fff}" +
      "#saaniya-cookie-banner .saaniya-cookie-manage{background:transparent;color:#e2e8f0;border:1px solid #475569!important}" +
      "@media (max-width:600px){#saaniya-cookie-banner{align-items:flex-start}}" +
      "@media (prefers-reduced-motion:reduce){#saaniya-cookie-banner{transition:none}}";
    document.head.appendChild(style);
  }

  function showBanner() {
    if (gpcOn()) {
      write("essential");
      return;
    }
    if (read() === "essential" || read() === "all") return;

    injectStyles();
    var banner = document.createElement("div");
    banner.id = "saaniya-cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie preferences");
    banner.innerHTML =
      "<p>We use <strong>essential</strong> storage for site function (for example language and security). " +
      "Optional <strong>analytics</strong> helps us improve the site. We do not sell personal data. " +
      "<a href=\"/cookies.html\">Cookie Policy</a> · <a href=\"/privacy.html\">Privacy</a>. " +
      "Global Privacy Control (GPC) is honored.</p>" +
      "<div class=\"saaniya-cookie-actions\">" +
      "<button type=\"button\" class=\"saaniya-cookie-essential\">Essential only</button>" +
      "<button type=\"button\" class=\"saaniya-cookie-all\">Accept analytics</button>" +
      "<button type=\"button\" class=\"saaniya-cookie-manage\">Cookie settings</button>" +
      "</div>";

    banner.querySelector(".saaniya-cookie-essential").addEventListener("click", function () {
      window.saaniyaSetCookieConsent("essential");
    });
    banner.querySelector(".saaniya-cookie-all").addEventListener("click", function () {
      window.saaniyaSetCookieConsent("all");
    });
    banner.querySelector(".saaniya-cookie-manage").addEventListener("click", function () {
      window.location.href = "/cookies.html#preferences";
    });

    document.body.appendChild(banner);
  }

  function init() {
    if (gpcOn()) write("essential");
    if (allowAnalytics()) loadAnalyticsIfAllowed();
    showBanner();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();