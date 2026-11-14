import { createHmac, randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import path from "node:path";

const apiUrl = "http://127.0.0.1:3100";
const requireFromRoot = createRequire(
  path.resolve(process.cwd(), "package.json"),
);
const testEnvironment = requireFromRoot("./tests/integration/test-env.cjs") as {
  VNPAY_HASH_SECRET: string;
};
const vnpayHashSecret = testEnvironment.VNPAY_HASH_SECRET;
const requireBackend = createRequire(
  path.resolve(process.cwd(), "backend", "package.json"),
);
const database = requireBackend(
  path.resolve(process.cwd(), "tests", "e2e", "db-fixture.cjs"),
) as {
  connect(databaseUrl: string): Promise<void>;
  disconnect(): Promise<void>;
  createInventoryFixture(fixture: E2EFixture): Promise<void>;
  findOrders(userId: string): Promise<
    Array<{
      id: string;
      status: string;
      payments: Array<{ status: string; amount: number }>;
      items: Array<{ qty: number }>;
    }>
  >;
  findIngredient(ingredientId: string): Promise<{
    stock: number;
    reservedQuantity: number;
  }>;
  cleanup(fixture: E2EFixture): Promise<void>;
};

interface E2EFixture {
  email: string;
  password: string;
  userId?: string;
  productId?: string;
  ingredientId?: string;
  productName?: string;
}

type ReadyE2EFixture = E2EFixture &
  Required<
    Pick<E2EFixture, "userId" | "productId" | "ingredientId" | "productName">
  >;

let fixture: E2EFixture | undefined;

test.beforeAll(async () => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for the E2E test.");
  }
  await database.connect(databaseUrl);
});

test.beforeEach(async ({ page, request }) => {
  fixture = {
    email: `e2e-${randomUUID()}@example.test`,
    password: "E2eTest123!",
  };
  await database.createInventoryFixture(fixture);

  const registration = await request.post(`${apiUrl}/auth/register`, {
    data: { email: fixture.email, password: fixture.password },
  });
  expect(registration.status()).toBe(201);
  fixture.userId = (await registration.json()).user.id;

  const login = await request.post(`${apiUrl}/auth/login`, {
    data: { email: fixture.email, password: fixture.password },
  });
  expect(login.status()).toBe(201);
  const { accessToken } = await login.json();
  await page.addInitScript((token) => {
    localStorage.setItem("accessToken", token);
  }, accessToken);
});

test.afterEach(async () => {
  if (fixture) {
    const currentFixture = fixture;
    fixture = undefined;
    await database.cleanup(currentFixture);
  }
});

test.afterAll(async () => {
  await database.disconnect();
});

test("a customer orders from the menu and completes a signed test payment", async ({
  page,
}) => {
  const currentFixture = getReadyFixture();
  await interceptVnpayResult(page, "00", "00");
  await placeOrderThroughUi(page, currentFixture.productName);

  await expect(page).toHaveURL(/\/payment\/result\?status=success/);
  await expect(page.getByText("Thanh toán thành công")).toBeVisible();

  const orders = await database.findOrders(currentFixture.userId);
  expect(orders).toHaveLength(1);
  expect(orders[0].status).toBe("PAID");
  expect(orders[0].payments).toHaveLength(1);
  expect(orders[0].payments[0].status).toBe("SUCCEEDED");
  expect(orders[0].items).toHaveLength(1);
  expect(orders[0].items[0].qty).toBe(1);

  const ingredient = await database.findIngredient(currentFixture.ingredientId);
  expect(ingredient.stock).toBe(288);
  expect(ingredient.reservedQuantity).toBe(0);
});

test("a customer cancellation returns VNPay code 24 and marks payment failed", async ({
  page,
}) => {
  const currentFixture = getReadyFixture();
  await interceptVnpayResult(page, "24", "02");
  await placeOrderThroughUi(page, currentFixture.productName);

  await expect(page).toHaveURL(/\/payment\/result\?status=failed/);
  await expect(page.getByText("Thanh toán chưa hoàn tất")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Đơn hàng chưa được thanh toán" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Thanh toán lại đơn này" }),
  ).toBeVisible();

  const orders = await database.findOrders(currentFixture.userId);
  expect(orders).toHaveLength(1);
  expect(orders[0].status).toBe("PAYMENT_FAILED");
  expect(orders[0].payments).toHaveLength(1);
  expect(orders[0].payments[0].status).toBe("FAILED");
  expect(orders[0].items).toHaveLength(1);
  expect(orders[0].items[0].qty).toBe(1);

  const ingredient = await database.findIngredient(currentFixture.ingredientId);
  expect(ingredient.stock).toBe(300);
  expect(ingredient.reservedQuantity).toBe(0);
});

function getReadyFixture(): ReadyE2EFixture {
  const currentFixture = fixture;
  if (!isReadyFixture(currentFixture)) {
    throw new Error("The E2E fixture was not initialized.");
  }
  return currentFixture;
}

function isReadyFixture(
  candidate: E2EFixture | undefined,
): candidate is ReadyE2EFixture {
  return Boolean(
    candidate?.productId &&
    candidate.userId &&
    candidate.ingredientId &&
    candidate.productName,
  );
}

async function interceptVnpayResult(
  page: Page,
  responseCode: string,
  transactionStatus: string,
): Promise<void> {
  await page.route("https://sandbox.vnpayment.vn/**", async (route) => {
    const callbackUrl = buildSignedReturnUrl(
      route.request().url(),
      responseCode,
      transactionStatus,
    );
    await route.fulfill({
      status: 302,
      headers: { location: callbackUrl },
    });
  });
}

async function placeOrderThroughUi(
  page: Page,
  productName: string,
): Promise<void> {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Hương vị yêu thích của bạn?" }),
  ).toBeVisible();
  await page
    .getByRole("article")
    .filter({ hasText: productName })
    .getByRole("link", { name: "Thêm vào giỏ hàng" })
    .click();

  await expect(page.getByRole("heading", { name: productName })).toBeVisible();
  await page.getByRole("button", { name: /Thêm vào giỏ hàng -/ }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.locator('input[name="receiverName"]').fill("Khách E2E");
  await page.locator('input[name="receiverPhone"]').fill("0900000000");
  await page.locator('input[name="deliveryAddress"]').fill("Địa chỉ kiểm thử");
  await page.getByRole("button", { name: "VNPAY" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Đặt hàng" }).click();
  await page.getByRole("button", { name: "Xác nhận" }).click();
}

function buildSignedReturnUrl(
  paymentUrl: string,
  responseCode: string,
  transactionStatus: string,
): string {
  const params = Object.fromEntries(new URL(paymentUrl).searchParams.entries());
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;
  Object.assign(params, {
    vnp_ResponseCode: responseCode,
    vnp_TransactionStatus: transactionStatus,
    vnp_TransactionNo: "1234567890",
    vnp_BankCode: "NCB",
    vnp_CardType: "ATM",
    vnp_PayDate: "20261114200000",
  });

  const canonicalQuery = Object.keys(params)
    .sort()
    .map((key) => `${encodeVnpValue(key)}=${encodeVnpValue(params[key])}`)
    .join("&");
  params.vnp_SecureHash = createHmac("sha512", vnpayHashSecret)
    .update(canonicalQuery, "utf8")
    .digest("hex");

  const callbackUrl = new URL("/payments/vnpay-return", apiUrl);
  for (const [key, value] of Object.entries(params)) {
    callbackUrl.searchParams.set(key, value);
  }
  return callbackUrl.toString();
}

function encodeVnpValue(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(
      /[!'()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
}
