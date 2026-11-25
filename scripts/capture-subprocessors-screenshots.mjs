import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const outDir = process.env.SCREENSHOT_DIR || "/opt/cursor/artifacts";
mkdirSync(outDir, { recursive: true });
const base = process.env.BASE_URL || "http://127.0.0.1:8765";

const browser = await chromium.launch();

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await desktop.goto(`${base}/subprocessors.html`, { waitUntil: "networkidle" });
await desktop.screenshot({ path: `${outDir}/subprocessors-desktop.png`, fullPage: true });

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
});
await mobile.goto(`${base}/subprocessors.html`, { waitUntil: "networkidle" });
await mobile.screenshot({ path: `${outDir}/subprocessors-mobile.png`, fullPage: true });

const privacy = await browser.newPage({ viewport: { width: 1280, height: 700 } });
await privacy.goto(`${base}/privacy.html`, { waitUntil: "networkidle" });
const link = privacy.locator('a[href="subprocessors.html"]').first();
await link.scrollIntoViewIfNeeded();
await privacy.screenshot({ path: `${outDir}/privacy-subprocessors-link.png`, fullPage: false });

await browser.close();
console.log("Screenshots saved to", outDir);