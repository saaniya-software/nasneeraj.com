/**
 * Insert unsubscribe / cookie links into every HTML footer (static HTML for crawlers).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const root = process.cwd();
const LEGAL_BLOCK = (prefix) => `            <a href="${prefix}unsubscribe.html">Email preferences</a>
            <a href="${prefix}cookies.html">Cookie Policy</a>
            <a href="#" class="saaniya-cookie-settings-link">Cookie settings</a>
`;

const LEGAL_SCRIPT =
  '<script src="/assets/site-legal-footer.js?v=20261125b" defer></script>\n';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const full = join(dir, name);
    const rel = relative(root, full).replace(/\\/g, "/");
    if (statSync(full).isDirectory()) {
      if (rel === "docs" || rel === "scripts" || rel === "tests") continue;
      walk(full, out);
      continue;
    }
    if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

function depthPrefix(file) {
  const rel = relative(root, file).replace(/\\/g, "/");
  const depth = rel.split("/").length - 1;
  return depth ? "../".repeat(depth) : "";
}

function hasLegalLinks(text) {
  return /unsubscribe\.html|href="\/unsubscribe/i.test(text) &&
    /cookies\.html|href="\/cookies/i.test(text) &&
    /saaniya-cookie-settings-link|Cookie settings/i.test(text);
}

function patchFile(file) {
  let text = readFileSync(file, "utf8");
  const prefix = depthPrefix(file);
  let changed = false;

  const needUnsub = !/unsubscribe\.html|\/unsubscribe/i.test(text);
  const needCookies = !/cookies\.html|\/cookies(?!-consent)/i.test(text);
  const needSettings = !/saaniya-cookie-settings-link|Cookie settings/i.test(text);

  if (needUnsub || needCookies || needSettings) {
    if (text.includes('class="footer-links"') || text.includes("class='footer-links'")) {
      const tagPattern = /<(?:div|nav) class="footer-links"[^>]*>\s*([\s\S]*?)\s*<\/(?:div|nav)>/g;
      text = text.replace(tagPattern, (m, inner) => {
        let add = "";
        if (needUnsub && !/unsubscribe/i.test(inner)) add += `            <a href="${prefix}unsubscribe.html">Email preferences</a>\n`;
        if (needCookies && !/cookies\.html|href="\/cookies/i.test(inner))
          add += `            <a href="${prefix}cookies.html">Cookie Policy</a>\n`;
        if (needSettings && !/saaniya-cookie-settings-link/i.test(inner))
          add += `            <a href="#" class="saaniya-cookie-settings-link">Cookie settings</a>\n`;
        if (!add) return m;
        changed = true;
        return m.replace(inner, inner.trimEnd() + "\n" + add);
      });
    }
    if ((needUnsub || needCookies || needSettings) && text.includes('class="site-footer__col"')) {
      text = text.replace(
        /(<div class="site-footer__col">\s*<p class="site-footer__col-title">Company<\/p>[\s\S]*?)(<\/div>\s*<div class="site-footer__bar">)/,
        (m, inner, bar) => {
          if (hasLegalLinks(inner)) return m;
          changed = true;
          return (
            inner +
            `\n        <a href="${prefix}privacy.html">Privacy</a>\n        <a href="${prefix}unsubscribe.html">Email preferences</a>\n        <a href="${prefix}cookies.html">Cookie Policy</a>\n        <a href="#" class="saaniya-cookie-settings-link">Cookie settings</a>\n      ` +
            bar
          );
        }
      );
    }
    if ((needUnsub || needCookies || needSettings) && text.includes('class="site-footer__bar"')) {
      text = text.replace(
        /(<div class="site-footer__bar"[^>]*>[\s\S]*?)(<\/div>\s*<\/footer>)/g,
        (m, inner, close) => {
          if (/unsubscribe/i.test(inner) && /cookies\.html/i.test(inner) && /cookie settings/i.test(inner)) return m;
          changed = true;
          let tail = "";
          if (!/unsubscribe/i.test(inner)) tail += ` ·\n      <a href="${prefix}unsubscribe.html">Email preferences</a>`;
          if (!/cookies\.html/i.test(inner)) tail += ` ·\n      <a href="${prefix}cookies.html">Cookie Policy</a>`;
          if (!/cookie settings/i.test(inner))
            tail += ` ·\n      <a href="#" class="saaniya-cookie-settings-link">Cookie settings</a>`;
          return inner + tail + "\n    " + close;
        }
      );
    }
    if ((needUnsub || needCookies || needSettings) && /<footer[\s\S]*?<\/footer>/i.test(text)) {
      text = text.replace(/<\/footer>/i, () => {
        changed = true;
        return `        <div class="footer-links" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:12px;">
${LEGAL_BLOCK(prefix)}        </div>
    </footer>`;
      });
    } else if (text.includes("</body>")) {
      changed = true;
      text = text.replace(
        "</body>",
        `    <footer class="footer" style="text-align:center;padding:24px;font-size:0.9rem;">
        <div class="footer-links">
${LEGAL_BLOCK(prefix)}        </div>
    </footer>
</body>`
      );
    }
  }

  if (!text.includes("site-legal-footer.js")) {
    if (text.includes("</body>")) {
      text = text.replace("</body>", LEGAL_SCRIPT + "</body>");
      changed = true;
    }
  }

  if (changed) writeFileSync(file, text);
  return changed;
}

let count = 0;
for (const file of walk(root)) {
  if (patchFile(file)) count += 1;
}
console.log(`patch-footer-legal-links: updated ${count} file(s)`);