import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = { "@": path.resolve(process.cwd(), "src") };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
          exclude: [
            "node_modules",
            ".next",
            "dist",
            "src/lib/sentry-helpers.test.ts",
            "src/**/*.component.test.{ts,tsx}",
            "src/**/*.component.spec.{ts,tsx}",
          ],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "happy-dom",
          environment: "happy-dom",
          include: [
            "src/**/*.component.test.{ts,tsx}",
            "src/**/*.component.spec.{ts,tsx}",
          ],
          exclude: ["node_modules", ".next", "dist"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        "src/lib/**/*.ts": {
          lines: 70,
          functions: 70,
          statements: 70,
        },
      },
    },
  },
});
