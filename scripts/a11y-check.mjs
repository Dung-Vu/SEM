import fs from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const baseUrl = process.env.A11Y_BASE_URL ?? "http://localhost:3000";
const routes = [
  "/",
  "/anki",
  "/anki/add",
  "/quests",
  "/speak",
  "/exam/cm_test",
  "/settings",
  "/analytics",
];

const browser = await chromium.launch({ headless: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  tags: ["wcag2a", "wcag2aa", "wcag21aa"],
  routes: [],
};
let blockingViolationCount = 0;

try {
  for (const route of routes) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const response = await page.goto(new URL(route, baseUrl).toString(), {
        waitUntil: "networkidle",
      });
      const results = await new AxeBuilder({ page })
        .withTags(report.tags)
        .analyze();
      const blockingViolations = results.violations.filter(({ impact }) =>
        impact === "serious" || impact === "critical"
      );

      blockingViolationCount += blockingViolations.length;
      report.routes.push({
        route,
        status: response?.status() ?? null,
        violations: results.violations,
        blockingViolationCount: blockingViolations.length,
      });
      console.log(
        `${route}: ${results.violations.length} total, ${blockingViolations.length} serious/critical`
      );
    } catch (error) {
      report.routes.push({ route, error: String(error) });
      blockingViolationCount += 1;
      console.error(`${route}: scan failed`, error);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

report.blockingViolationCount = blockingViolationCount;
await fs.writeFile("a11y-report.json", `${JSON.stringify(report, null, 2)}\n`);

if (blockingViolationCount > 0) {
  console.error(`Accessibility check failed with ${blockingViolationCount} serious/critical violation(s).`);
  process.exitCode = 1;
} else {
  console.log("Accessibility check passed with no serious/critical violations.");
}
