import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const outDir = process.env.SCREENSHOT_DIR || "/opt/cursor/artifacts";
mkdirSync(outDir, { recursive: true });
const base = process.env.BASE_URL || "http://127.0.0.1:8765";

const browser = await chromium.launch();

async function footerShot(path, name) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  const footer = page.locator("footer").last();
  await footer.screenshot({ path: `${outDir}/${name}.png` });
  await page.close();
}

async function navShot(path, name) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  const nav = page.locator("nav.navbar, nav.site-nav, #navLinks").first();
  await nav.screenshot({ path: `${outDir}/${name}.png` });
  await page.close();
}

await footerShot("/services.html", "footer-services");
await footerShot("/privacy.html", "footer-privacy");
await navShot("/index.html", "sidebar-legal-index");

await browser.close();
console.log("Screenshots saved to", outDir);