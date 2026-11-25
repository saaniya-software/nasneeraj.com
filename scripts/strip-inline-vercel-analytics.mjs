/**
 * Remove unconditional Vercel Web Analytics snippets from HTML (loaded via cookie-consent instead).
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const blocks = [
  /\s*<!-- Vercel Web Analytics -->\s*<script>\s*window\.va = window\.va[\s\S]*?<\/script>\s*<script defer src="\/_vercel\/insights\/script\.js"><\/script>\s*/gi,
  /\s*<script>\s*window\.va = window\.va[\s\S]*?<\/script>\s*<script defer src="\/_vercel\/insights\/script\.js"><\/script>\s*/gi,
  /\s*<script defer src="\/_vercel\/insights\/script\.js"><\/script>\s*/gi,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

let changed = 0;
for (const file of walk(root)) {
  const text = readFileSync(file, "utf8");
  let next = text;
  for (const block of blocks) next = next.replace(block, "\n");
  if (next !== text) {
    writeFileSync(file, next);
    changed += 1;
  }
}
console.log(`strip-inline-vercel-analytics: updated ${changed} file(s)`);