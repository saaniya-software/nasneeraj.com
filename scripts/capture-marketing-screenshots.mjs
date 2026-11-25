import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const outDir = process.env.SCREENSHOT_DIR || "/opt/cursor/artifacts";
mkdirSync(outDir, { recursive: true });
const base = process.env.BASE_URL || "http://127.0.0.1:8765";

const browser = await chromium.launch();
const ctxDesktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctxDesktop.newPage();
await page.goto(`${base}/unsubscribe.html`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/unsubscribe-desktop.png`, fullPage: true });

const ctxMobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
});
const mobile = await ctxMobile.newPage();
await mobile.goto(`${base}/unsubscribe.html`, { waitUntil: "networkidle" });
await mobile.screenshot({ path: `${outDir}/unsubscribe-mobile.png`, fullPage: true });

const ctxCookies = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const home = await ctxCookies.newPage();
await home.goto(`${base}/index.html`, { waitUntil: "networkidle" });
await home.waitForSelector("#saaniya-cookie-banner", { timeout: 10000 });
await home.screenshot({ path: `${outDir}/cookie-banner-desktop.png`, fullPage: false });

await browser.close();
console.log("Screenshots saved to", outDir);