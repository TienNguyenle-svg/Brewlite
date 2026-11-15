import { defineConfig } from "@playwright/test";
import { createRequire } from "node:module";
import path from "node:path";

const apiUrl = "http://127.0.0.1:3100";
const frontendUrl = "http://127.0.0.1:3101";
const requireFromRoot = createRequire(
  path.resolve(process.cwd(), "package.json"),
);
const testEnvironment = requireFromRoot("./tests/integration/test-env.cjs") as {
  JWT_SECRET: string;
  VNPAY_TMN_CODE: string;
  VNPAY_HASH_SECRET: string;
  VNPAY_URL: string;
};
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    "Set TEST_DATABASE_URL to the dedicated test database before running Playwright.",
  );
}

const databaseName = decodeURIComponent(
  new URL(testDatabaseUrl).pathname.replace(/^\/+|\/+$/g, ""),
);
if (!/(?:^|[_-])test$/i.test(databaseName)) {
  throw new Error(
    "TEST_DATABASE_URL must use a dedicated test database, such as brewlite_test.",
  );
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.spec.ts",
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: frontendUrl,
    browserName: "chromium",
    headless: true,
  },
  webServer: [
    {
      command: "pnpm --dir backend run start:dev",
      url: `${apiUrl}/health`,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        DATABASE_URL: testDatabaseUrl,
        TEST_DATABASE_URL: testDatabaseUrl,
        PORT: "3100",
        JWT_SECRET: testEnvironment.JWT_SECRET,
        VNPAY_TMN_CODE: testEnvironment.VNPAY_TMN_CODE,
        VNPAY_HASH_SECRET: testEnvironment.VNPAY_HASH_SECRET,
        VNPAY_URL: testEnvironment.VNPAY_URL,
        VNPAY_RETURN_URL: `${apiUrl}/payments/vnpay-return`,
        FRONTEND_URL: frontendUrl,
      },
    },
    {
      command:
        "pnpm --dir frontend exec next dev --hostname 127.0.0.1 --port 3101",
      url: frontendUrl,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        NEXT_PUBLIC_API_URL: apiUrl,
        API_URL_INTERNAL: apiUrl,
      },
    },
  ],
});
