import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { BaristaService } from '../../src/barista/barista.service';
import { BaristaOrderStatus } from '../../src/barista/dto/update-barista-order-status.dto';
import { DiscountsService } from '../../src/discounts/discounts.service';
import { InventoryService } from '../../src/inventory/inventory.service';
import { OrdersService } from '../../src/orders/orders.service';
import { CreateOrderDto } from '../../src/orders/dto/create-order.dto';
import { PrismaService } from '../../src/prisma/prisma.service';

class IntegrationPrismaService extends PrismaClient {
  constructor(databaseUrl: string) {
    super({ datasources: { db: { url: databaseUrl } } });
  }
}

interface Fixture {
  userId: string;
  ingredientId: string;
  productId: string;
}

describe('Task 10 order integration', () => {
  let prisma: PrismaService;
  let moduleRef: TestingModule;
  let ordersService: OrdersService;
  let baristaService: BaristaService;
  const userIds: string[] = [];
  const ingredientIds: string[] = [];
  const productIds: string[] = [];

  beforeAll(async () => {
    const databaseUrl = process.env.TEST_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL must point to a dedicated migrated test database.',
      );
    }

    moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useFactory: () => new IntegrationPrismaService(databaseUrl),
        },
        InventoryService,
        DiscountsService,
        OrdersService,
        BaristaService,
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    ordersService = moduleRef.get(OrdersService);
    baristaService = moduleRef.get(BaristaService);
    await prisma.$connect();
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
      await prisma.promotionUsage.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      await prisma.loyaltyTransaction.deleteMany({
        where: { orderId: { in: orderIds } },
      });
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
    if (moduleRef) {
      await moduleRef.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('rejects an invalid order transition and leaves the persisted state unchanged', async () => {
    const fixture = await createFixture(24);
    const order = await ordersService.create(
      createOrderDto(fixture.productId),
      fixture.userId,
      makeIdempotencyKey(),
    );

    await expect(
      baristaService.updateOrderStatus(order.id, BaristaOrderStatus.READY),
    ).rejects.toBeInstanceOf(BadRequestException);

    const persistedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { status: true },
    });
    expect(persistedOrder.status).toBe('PENDING');
  });

  it('creates one order when concurrent requests reuse the same idempotency key', async () => {
    const fixture = await createFixture(24);
    const dto = createOrderDto(fixture.productId);
    const key = makeIdempotencyKey();

    const orders = await Promise.all([
      ordersService.create(dto, fixture.userId, key),
      ordersService.create(dto, fixture.userId, key),
    ]);

    expect(orders[0].id).toBe(orders[1].id);
    expect(
      await prisma.order.count({ where: { userId: fixture.userId } }),
    ).toBe(1);
    expect(
      await prisma.orderIdempotency.count({
        where: { userId: fixture.userId, idempotencyKey: key },
      }),
    ).toBe(1);

    const ingredient = await prisma.ingredient.findUniqueOrThrow({
      where: { id: fixture.ingredientId },
      select: { stock: true, reservedQuantity: true },
    });
    expect(ingredient.reservedQuantity).toBe(12);
    expect(ingredient.reservedQuantity).toBeLessThanOrEqual(ingredient.stock);
  });

  it('does not reserve more ingredient stock than available for concurrent orders', async () => {
    const fixture = await createFixture(12);

    const results = await Promise.allSettled([
      ordersService.create(
        createOrderDto(fixture.productId),
        fixture.userId,
        makeIdempotencyKey(),
      ),
      ordersService.create(
        createOrderDto(fixture.productId),
        fixture.userId,
        makeIdempotencyKey(),
      ),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    const rejected = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    expect(rejected?.reason).toBeInstanceOf(ConflictException);
    expect(
      await prisma.order.count({ where: { userId: fixture.userId } }),
    ).toBe(1);

    const ingredient = await prisma.ingredient.findUniqueOrThrow({
      where: { id: fixture.ingredientId },
      select: { stock: true, reservedQuantity: true },
    });
    expect(ingredient.reservedQuantity).toBeLessThanOrEqual(ingredient.stock);
    expect(ingredient.reservedQuantity).toBe(12);
  });

  async function createFixture(stock: number): Promise<Fixture> {
    const suffix = randomUUID();
    const user = await prisma.user.create({
      data: {
        email: `task10-${suffix}@example.test`,
        passwordHash: 'integration-test-only',
      },
    });
    userIds.push(user.id);

    const ingredient = await prisma.ingredient.create({
      data: { name: `Task10 ingredient ${suffix}`, stock, unit: 'gram' },
    });
    ingredientIds.push(ingredient.id);

    const product = await prisma.product.create({
      data: { name: `Task10 product ${suffix}`, price: 18000 },
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
      userId: user.id,
      ingredientId: ingredient.id,
      productId: product.id,
    };
  }

  function createOrderDto(productId: string): CreateOrderDto {
    return {
      items: [{ productId, size: 'M', qty: 1 }],
      receiverName: 'Integration Test',
      receiverPhone: '0000000000',
      deliveryAddress: 'Test address',
    };
  }

  function makeIdempotencyKey(): string {
    return `ORD-${Date.now()}${randomUUID().replace(/\D/g, '')}`;
  }
});
