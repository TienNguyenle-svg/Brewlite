const path = require("node:path");
const { createRequire } = require("node:module");
const { randomUUID } = require("node:crypto");

const requireFromBackend = createRequire(
  path.resolve(__dirname, "../../backend/package.json"),
);
const { PrismaClient } = requireFromBackend("@prisma/client");

let prisma;

async function connect(databaseUrl) {
  if (!databaseUrl) {
    throw new Error("A dedicated test database URL is required.");
  }
  prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  await prisma.$connect();
}

async function createInventoryFixture(fixture) {
  const suffix = randomUUID();
  fixture.productName = `E2E coffee ${suffix}`;

  const ingredient = await prisma.ingredient.create({
    data: {
      name: `E2E ingredient ${suffix}`,
      stock: 300,
      unit: "gram",
    },
  });
  fixture.ingredientId = ingredient.id;

  const product = await prisma.product.create({
    data: { name: fixture.productName, price: 30000, category: "Cà phê" },
  });
  fixture.productId = product.id;

  await prisma.recipe.create({
    data: {
      productId: product.id,
      ingredientId: ingredient.id,
      amount: 12,
    },
  });
}

async function findOrders(userId) {
  return prisma.order.findMany({
    where: { userId },
    include: { payments: true, items: true },
  });
}

async function findIngredient(ingredientId) {
  return prisma.ingredient.findUniqueOrThrow({
    where: { id: ingredientId },
    select: { stock: true, reservedQuantity: true },
  });
}

async function cleanup(fixture) {
  const user = await prisma.user.findUnique({
    where: { email: fixture.email },
  });
  const userId = fixture.userId ?? user?.id;

  if (userId) {
    const orders = await prisma.order.findMany({
      where: { userId },
      select: { id: true },
    });
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
      await prisma.orderIdempotency.deleteMany({ where: { userId } });
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    await prisma.loyaltyTransaction.deleteMany({ where: { userId } });
  }

  if (fixture.productId) {
    await prisma.recipe.deleteMany({
      where: { productId: fixture.productId },
    });
    await prisma.product.delete({ where: { id: fixture.productId } });
  }
  if (fixture.ingredientId) {
    await prisma.ingredient.delete({ where: { id: fixture.ingredientId } });
  }
  if (userId) {
    await prisma.user.delete({ where: { id: userId } });
  }
}

async function disconnect() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}

module.exports = {
  connect,
  createInventoryFixture,
  findOrders,
  findIngredient,
  cleanup,
  disconnect,
};
