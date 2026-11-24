import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { DiscountsService } from '../discounts/discounts.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const prisma = {
    user: { findUnique: jest.fn() },
    product: { findUnique: jest.fn() },
    topping: { findMany: jest.fn() },
    promotion: { findUnique: jest.fn() },
    order: { findUnique: jest.fn(), create: jest.fn() },
    orderIdempotency: { findUnique: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  };
  const inventory = { reserveOrder: jest.fn() };
  const discounts = { validatePromotionForOrder: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      loyaltyPoints: 0,
    });
    prisma.product.findUnique.mockResolvedValue({
      id: 'product-1',
      price: 10000,
      isActive: true,
    });
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => unknown) => callback(prisma),
    );
    inventory.reserveOrder.mockResolvedValue(undefined);
    discounts.validatePromotionForOrder.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: InventoryService, useValue: inventory },
        { provide: DiscountsService, useValue: discounts },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.each(['ORDER_PAID', 'Cộng điểm tích lũy từ đơn order-paid'])(
    'hủy đơn thu hồi 7 điểm từ 107 về 100 với lý do %s, không thu hồi lần hai',
    async (reason) => {
      const order = {
        id: 'order-paid', userId: 'user-1', status: 'PAID',
        pointsUsed: 0, items: [],
        payments: [{ id: 'payment-failed', status: 'FAILED' }, { id: 'payment-paid', status: 'SUCCEEDED' }],
      };
      const tx = {
        $queryRaw: jest.fn().mockResolvedValue([{ loyaltyPoints: 107, pointsOwed: 0 }]),
        order: {
          findUnique: jest.fn().mockImplementation(async () => order),
          update: jest.fn().mockImplementation(async () => {
            order.status = 'CANCELLED';
            return order;
          }),
        },
        user: { update: jest.fn() },
        loyaltyTransaction: {
          findMany: jest.fn().mockResolvedValue([{ reason, points: 7 }]),
          create: jest.fn(),
        },
        payment: { update: jest.fn() },
      };
      const refundOrder = jest.fn();
      const cancellation = new OrdersService(
        { $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx) } as never,
        { refundOrder } as never,
        discounts as never,
      );

      await cancellation.cancelOrder(order.id, 'user-1');

      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { loyaltyPoints: 100, pointsOwed: 0 },
      });
      expect(tx.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ points: -7, orderId: order.id }),
      });
      expect(tx.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-paid' }, data: { status: 'REFUNDED' },
      });
      await expect(cancellation.cancelOrder(order.id, 'user-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.user.update).toHaveBeenCalledTimes(1);
      expect(refundOrder).toHaveBeenCalledTimes(1);
    },
  );

  it('rejects order creation without an Idempotency-Key', async () => {
    await expect(
      service.create({} as never, 'user-1', ''),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns the same order when concurrent requests reuse an Idempotency-Key', async () => {
    let storedRecord:
      | {
          requestHash: string;
          order: Record<string, unknown>;
        }
      | null = null;
    let createAttempts = 0;
    const persistedOrderIds: string[] = [];
    const createdOrders = new Map<string, Record<string, unknown>>();
    prisma.orderIdempotency.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockImplementation(async () => storedRecord);
    prisma.order.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => {
        createAttempts += 1;
        const order = { id: `order-${createAttempts}`, ...data, items: [] };
        createdOrders.set(order.id, order);
        return order;
      },
    );
    prisma.orderIdempotency.create.mockImplementation(
      async ({ data }: { data: Record<string, string> }) => {
        if (storedRecord) {
          throw new Prisma.PrismaClientKnownRequestError(
            'Unique constraint failed',
            { code: 'P2002', clientVersion: 'test' },
          );
        }

        storedRecord = {
          requestHash: data.requestHash,
          order: createdOrders.get(data.orderId)!,
        };
        persistedOrderIds.push(data.orderId);
        return storedRecord;
      },
    );

    const dto = {
      items: [
        {
          productId: 'product-1',
          size: 'M',
          qty: 1,
          toppingIds: [],
        },
      ],
      receiverName: 'Customer',
      receiverPhone: '0900000000',
      deliveryAddress: 'Address',
    };

    const [first, second] = await Promise.all([
      service.create(dto, 'user-1', 'ORD-123'),
      service.create(dto, 'user-1', 'ORD-123'),
    ]);

    expect(first.id).toBe('order-1');
    expect(second.id).toBe(first.id);
    expect(createAttempts).toBe(2);
    expect(prisma.orderIdempotency.create).toHaveBeenCalledTimes(2);
    expect(persistedOrderIds).toEqual([first.id]);
    expect(inventory.reserveOrder).toHaveBeenCalledTimes(1);
  });
});
