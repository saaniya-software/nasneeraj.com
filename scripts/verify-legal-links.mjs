/**
 * Fail if any HTML page lacks unsubscribe + cookie policy + cookie settings links.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();

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
    if (name.endsWith(".html")) out.push(rel);
  }
  return out;
}

const failures = [];
for (const rel of walk(root)) {
  const text = readFileSync(join(root, rel), "utf8");
  const hasSubprocessors = /subprocessors\.html|\/subprocessors/i.test(text);
  const hasUnsub = /unsubscribe\.html|\/unsubscribe|href="unsubscribe/i.test(text);
  const hasCookies = /cookies\.html|\/cookies|href="cookies/i.test(text);
  const hasSettings = /saaniya-cookie-settings-link|Cookie settings/i.test(text);
  if (!hasSubprocessors || !hasUnsub || !hasCookies || !hasSettings) {
    failures.push({ rel, hasSubprocessors, hasUnsub, hasCookies, hasSettings });
  }
}

if (failures.length) {
  console.error("verify-legal-links: FAIL");
  for (const f of failures) console.error(f);
  process.exit(1);
}
console.log(`verify-legal-links: OK (${walk(root).length} HTML files)`);