import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { randomUUID } from "crypto";
import { PrismaService } from "../../backend/src/prisma/prisma.service";
import { AppModule } from "../../backend/src/app.module";
import request from "supertest";

class IntegrationPrismaService extends PrismaService {
  constructor(databaseUrl: string) {
    super({ datasources: { db: { url: databaseUrl } } });
  }
}

interface Fixture {
  customer: {
    id: string;
    email: string;
    role: string;
    tokenVersion: number;
  };
  ingredientId: string;
  productId: string;
}

describe("Order and payment API integration", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  const userIds: string[] = [];
  const ingredientIds: string[] = [];
  const productIds: string[] = [];
  beforeAll(async () => {
    const databaseUrl = process.env.TEST_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        "TEST_DATABASE_URL must point to a dedicated migrated test database.",
      );
    }

    const testPrisma = new IntegrationPrismaService(databaseUrl);
    await testPrisma.$connect();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(testPrisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
  });

  afterEach(async () => {
    const orders = userIds.length
      ? await prisma.order.findMany({
          where: { userId: { in: userIds } },
          select: { id: true },
        })
      : [];
    const orderIds = orders.map((order) => order.id);

    if (orderIds.length) {
      const items = await prisma.orderItem.findMany({
        where: { orderId: { in: orderIds } },
        select: { id: true },
      });
      const itemIds = items.map((item) => item.id);

      if (itemIds.length) {
        await prisma.orderItemTopping.deleteMany({
          where: { orderItemId: { in: itemIds } },
        });
      }

      await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.orderIdempotency.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    if (productIds.length) {
      await prisma.recipe.deleteMany({
        where: { productId: { in: productIds } },
      });
      await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    }
    if (ingredientIds.length) {
      await prisma.ingredient.deleteMany({
        where: { id: { in: ingredientIds } },
      });
    }
    if (userIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    userIds.length = 0;
    ingredientIds.length = 0;
    productIds.length = 0;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it("serves GET /health and reports database availability", async () => {
    const response = await request(app.getHttpServer())
      .get("/health")
      .expect(200);

    expect(response.body).toEqual({
      status: "ok",
      db: "up",
      uptime: expect.any(Number),
    });
  });

  it("persists orders and payment attempts created through the HTTP API", async () => {
    const fixture = await createFixture(24);
    const token = await createToken(fixture.customer);
    const orderKey = makeIdempotencyKey("ORD");
    const orderResponse = await postOrder(fixture, token, orderKey);

    expect(orderResponse.status).toBe(201);
    const orderId: string = orderResponse.body.id;
    const storedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });
    expect(storedOrder.status).toBe("PENDING");
    expect(storedOrder.items).toHaveLength(1);
    expect(
      await prisma.orderIdempotency.count({
        where: { userId: fixture.customer.id, idempotencyKey: orderKey },
      }),
    ).toBe(1);

    const paymentKey = makeIdempotencyKey("PAY");
    const paymentResponse = await request(app.getHttpServer())
      .post("/payments")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", paymentKey)
      .send({ orderId })
      .expect(201);
    const storedPayment = await prisma.payment.findUniqueOrThrow({
      where: { id: paymentResponse.body.paymentId },
    });

    expect(storedPayment.orderId).toBe(orderId);
    expect(storedPayment.idempotencyKey).toBe(`${orderId}:${paymentKey}`);
    expect(storedPayment.amount).toBe(storedOrder.total);
    expect(storedPayment.status).toBe("PENDING");

    const ingredient = await prisma.ingredient.findUniqueOrThrow({
      where: { id: fixture.ingredientId },
      select: { stock: true, reservedQuantity: true },
    });
    expect(ingredient.reservedQuantity).toBe(12);
    expect(ingredient.reservedQuantity).toBeLessThanOrEqual(ingredient.stock);
  });

  it("creates only one order when requests reuse the same Idempotency-Key", async () => {
    const fixture = await createFixture(24);
    const token = await createToken(fixture.customer);
    const key = makeIdempotencyKey("ORD");

    const responses = await Promise.all([
      postOrder(fixture, token, key),
      postOrder(fixture, token, key),
    ]);

    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    expect(responses[0].body.id).toBe(responses[1].body.id);
    expect(
      await prisma.order.count({ where: { userId: fixture.customer.id } }),
    ).toBe(1);
    expect(
      await prisma.orderIdempotency.count({
        where: { userId: fixture.customer.id, idempotencyKey: key },
      }),
    ).toBe(1);

    const ingredient = await prisma.ingredient.findUniqueOrThrow({
      where: { id: fixture.ingredientId },
      select: { stock: true, reservedQuantity: true },
    });
    expect(ingredient.reservedQuantity).toBe(12);
    expect(ingredient.reservedQuantity).toBeLessThanOrEqual(ingredient.stock);
  });

  it("rejects invalid order-state transitions through the API without changing the order", async () => {
    const fixture = await createFixture(24);
    const customerToken = await createToken(fixture.customer);
    const orderResponse = await postOrder(
      fixture,
      customerToken,
      makeIdempotencyKey("ORD"),
    );
    const barista = await createUser("BARISTA");
    const baristaToken = await createToken(barista);
    const orderId: string = orderResponse.body.id;

    await request(app.getHttpServer())
      .patch(`/barista/orders/${orderId}`)
      .set("Authorization", `Bearer ${baristaToken}`)
      .send({ status: "READY" })
      .expect(400);

    const storedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { status: true },
    });
    expect(storedOrder.status).toBe("PENDING");
  });

  it("does not oversell stock when different customers order concurrently", async () => {
    const fixture = await createFixture(12);
    const token = await createToken(fixture.customer);
    const secondCustomer = await createUser("CUSTOMER");
    const secondFixture = { ...fixture, customer: secondCustomer };
    const secondToken = await createToken(secondCustomer);

    const responses = await Promise.all([
      postOrder(fixture, token, makeIdempotencyKey("ORD")),
      postOrder(secondFixture, secondToken, makeIdempotencyKey("ORD")),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    expect(
      await prisma.order.count({
        where: { userId: { in: [fixture.customer.id, secondCustomer.id] } },
      }),
    ).toBe(1);

    const ingredient = await prisma.ingredient.findUniqueOrThrow({
      where: { id: fixture.ingredientId },
      select: { stock: true, reservedQuantity: true },
    });
    expect(ingredient.reservedQuantity).toBe(12);
    expect(ingredient.reservedQuantity).toBeLessThanOrEqual(ingredient.stock);
  });

  async function createFixture(stock: number): Promise<Fixture> {
    const customer = await createUser("CUSTOMER");
    const suffix = randomUUID();
    const ingredient = await prisma.ingredient.create({
      data: { name: `Integration ingredient ${suffix}`, stock, unit: "gram" },
    });
    ingredientIds.push(ingredient.id);

    const product = await prisma.product.create({
      data: { name: `Integration product ${suffix}`, price: 18000 },
    });
    productIds.push(product.id);

    await prisma.recipe.create({
      data: {
        productId: product.id,
        ingredientId: ingredient.id,
        amount: 12,
      },
    });

    return {
      customer,
      ingredientId: ingredient.id,
      productId: product.id,
    };
  }

  async function createUser(role: string) {
    const user = await prisma.user.create({
      data: {
        email: `integration-${randomUUID()}@example.test`,
        passwordHash: "integration-test-only",
        role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        tokenVersion: true,
      },
    });
    userIds.push(user.id);
    return user;
  }

  async function createToken(user: Fixture["customer"]): Promise<string> {
    return jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });
  }

  function postOrder(fixture: Fixture, token: string, key: string) {
    return request(app.getHttpServer())
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", key)
      .ok(() => true)
      .send({
        items: [
          {
            productId: fixture.productId,
            size: "M",
            qty: 1,
            toppingIds: [],
          },
        ],
        receiverName: "Integration Customer",
        receiverPhone: "0900000000",
        deliveryAddress: "Test address",
      });
  }

  function makeIdempotencyKey(prefix: "ORD" | "PAY"): string {
    const digits = `${Date.now()}${randomUUID().replace(/\D/g, "")}`;
    return `${prefix}-${prefix === "PAY" ? digits.slice(0, 15) : digits}`;
  }
});
