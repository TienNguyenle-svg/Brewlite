import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiscountsService } from './discounts.service';

describe('DiscountsService', () => {
  let service: DiscountsService;

  const prisma = {
    order: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
    promotion: { findUnique: jest.fn() },
    promotionUsage: {
      findUnique: jest.fn(),
      createMany: jest.fn(),
    },
    payment: { findFirst: jest.fn() },
    product: { findUnique: jest.fn() },
    topping: { findMany: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
    loyaltyTransaction: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  const promotion = {
    id: 'promo-1',
    code: 'WELCOME10',
    discount: 10,
    type: 'PERCENT',
    minOrder: 50000,
    startAt: null as Date | null,
    expiredAt: null as Date | null,
    usageLimit: null as number | null,
    active: true,
  };

  beforeEach(() => {
    jest.resetAllMocks();

    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => unknown) => callback(prisma),
    );
    prisma.$queryRaw.mockResolvedValue([]);
    prisma.$executeRaw.mockResolvedValue(1);
    prisma.payment.findFirst.mockResolvedValue(null);
    prisma.promotionUsage.findUnique.mockResolvedValue(null);
    prisma.order.count.mockResolvedValue(0);

    service = new DiscountsService(prisma as unknown as PrismaService);
  });

  // Khẳng định cốt lõi: xem trước mã / điểm không ghi dữ liệu.
  function expectNothingConsumed() {
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.loyaltyTransaction.create).not.toHaveBeenCalled();
  }

  // ---------------------------------------------------------------------------
  describe('previewCheckout', () => {
    const items = [{ productId: 'product-1', size: 'M' as const, qty: 1 }];

    beforeEach(() => {
      prisma.product.findUnique.mockResolvedValue({ price: 100000 });
      prisma.topping.findMany.mockResolvedValue([]);
    });

    it('tính voucher và ship khi không dùng điểm, không ghi dữ liệu', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);

      const result = await service.previewCheckout(
        'user-1',
        items,
        'WELCOME10',
        false,
      );

      expect(result).toEqual({
        promotionCode: 'WELCOME10',
        subtotal: 100000,
        discountAmount: 10000,
        pointsUsed: 0,
        pointsDiscount: 0,
        shippingFee: 0,
        total: 90000,
      });
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expectNothingConsumed();
    });

    it('dùng điểm theo lựa chọn và áp sau voucher', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 5000 });

      const result = await service.previewCheckout(
        'user-1',
        items,
        '  welcome10 ',
        true,
      );

      expect(result.promotionCode).toBe('WELCOME10');
      expect(result.pointsUsed).toBe(5000);
      expect(result.pointsDiscount).toBe(5000);
      expect(result.total).toBe(85000);
      expect(prisma.promotion.findUnique).toHaveBeenCalledWith({
        where: { code: 'WELCOME10' },
      });
    });

    it('tính theo giá size và topping, đồng thời tính phí ship dưới 100.000đ', async () => {
      prisma.product.findUnique.mockResolvedValue({ price: 50000 });
      prisma.topping.findMany.mockResolvedValue([
        { id: 'topping-1', price: 5000 },
      ]);
      prisma.promotion.findUnique.mockResolvedValue({
        ...promotion,
        discount: 10,
        minOrder: 0,
      });

      const result = await service.previewCheckout(
        'user-1',
        [
          {
            productId: 'product-1',
            size: 'L',
            qty: 1,
            toppingIds: ['topping-1'],
          },
        ],
        'WELCOME10',
        false,
      );

      expect(result).toEqual({
        promotionCode: 'WELCOME10',
        subtotal: 65000,
        discountAmount: 6500,
        pointsUsed: 0,
        pointsDiscount: 0,
        shippingFee: 15000,
        total: 73500,
      });
    });

    it('chấp nhận toppingIds rỗng tường minh', async () => {
      const result = await service.previewCheckout(
        'user-1',
        [{ ...items[0], toppingIds: [] }],
        undefined,
        false,
      );

      expect(result.subtotal).toBe(100000);
      expect(prisma.topping.findMany).not.toHaveBeenCalled();
    });

    it('từ chối nếu sản phẩm hoặc topping không tồn tại', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.previewCheckout('user-1', items, 'WELCOME10', false),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.promotion.findUnique).not.toHaveBeenCalled();
    });

    it('bỏ qua mã trống khi voucher không được chọn', async () => {
      const result = await service.previewCheckout(
        'user-1',
        items,
        '   ',
        false,
      );

      expect(result.promotionCode).toBeNull();
      expect(result.discountAmount).toBe(0);
      expect(prisma.promotion.findUnique).not.toHaveBeenCalled();
    });

    it('mã không tồn tại => 404', async () => {
      prisma.promotion.findUnique.mockResolvedValue(null);

      await expect(
        service.previewCheckout('user-1', items, 'NOPE', false),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('mã bị tắt => 400', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...promotion,
        active: false,
      });

      await expect(
        service.previewCheckout('user-1', items, 'WELCOME10', false),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('mã hết hạn => 400', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...promotion,
        expiredAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.previewCheckout('user-1', items, 'WELCOME10', false),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('giỏ chưa đạt mức tối thiểu => 400', async () => {
      prisma.product.findUnique.mockResolvedValue({ price: 40000 });
      prisma.promotion.findUnique.mockResolvedValue(promotion);

      await expect(
        service.previewCheckout('user-1', items, 'WELCOME10', false),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('tài khoản đã dùng mã này rồi => 409', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);
      prisma.promotionUsage.findUnique.mockResolvedValue({
        orderId: 'order-old',
      });

      await expect(
        service.previewCheckout('user-1', items, 'WELCOME10', false),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('kiểm tra lượt dùng theo cặp (tài khoản, mã)', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);

      await service.previewCheckout('user-1', items, 'WELCOME10', false);

      expect(prisma.promotionUsage.findUnique).toHaveBeenCalledWith({
        where: {
          userId_promotionId: { userId: 'user-1', promotionId: 'promo-1' },
        },
      });
    });

    it('mã chưa đến ngày bắt đầu => 400', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...promotion,
        startAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.previewCheckout('user-1', items, 'WELCOME10', false),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('mã đang được giữ ở đơn chờ thanh toán khác của khách => 409', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);
      prisma.order.count.mockResolvedValueOnce(1);

      await expect(
        service.previewCheckout('user-1', items, 'WELCOME10', false),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('mã đã hết lượt (đơn đã thanh toán + đơn đang giữ chỗ) => 409', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...promotion,
        usageLimit: 5,
      });
      prisma.order.count.mockResolvedValueOnce(0).mockResolvedValueOnce(5);

      await expect(
        service.previewCheckout('user-1', items, 'WELCOME10', false),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('mã còn lượt dùng => qua', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...promotion,
        usageLimit: 5,
      });
      prisma.order.count.mockResolvedValueOnce(0).mockResolvedValueOnce(4);

      const result = await service.previewCheckout(
        'user-1',
        items,
        'WELCOME10',
        false,
      );

      expect(result.promotionCode).toBe('WELCOME10');
    });

    it('số lượng chỉ tính đơn đã thanh toán và đơn PENDING (PAYMENT_FAILED, CANCELLED nhả mã)', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...promotion,
        usageLimit: 5,
      });

      await service.previewCheckout('user-1', items, 'WELCOME10', false);

      expect(prisma.order.count).toHaveBeenLastCalledWith({
        where: {
          promotionId: 'promo-1',
          OR: [
            { status: { in: ['PAID', 'PREPARING', 'READY', 'COMPLETED'] } },
            { status: { in: ['PENDING'] } },
          ],
        },
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('tùy chọn điểm trong preview', () => {
    const items = [{ productId: 'product-1', size: 'M' as const, qty: 1 }];

    beforeEach(() => {
      prisma.product.findUnique.mockResolvedValue({ price: 100000 });
      prisma.topping.findMany.mockResolvedValue([]);
    });

    it('không dùng điểm thì không đọc số dư điểm', async () => {
      const result = await service.previewCheckout(
        'user-1',
        items,
        undefined,
        false,
      );

      expect(result.pointsUsed).toBe(0);
      expect(result.pointsDiscount).toBe(0);
      expect(result.shippingFee).toBe(0);
      expect(result.total).toBe(100000);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('từ chối dùng điểm nếu số dư dưới 100', async () => {
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 50 });

      await expect(
        service.previewCheckout('user-1', items, undefined, true),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.order.update).not.toHaveBeenCalled();
      expectNothingConsumed();
    });

    it('không cho dùng điểm đang bị nợ do thu hồi điểm từ đơn hủy', async () => {
      prisma.user.findUnique.mockResolvedValue({
        loyaltyPoints: 500,
        reservedPoints: 0,
        pointsOwed: 450,
      });

      await expect(
        service.previewCheckout('user-1', items, undefined, true),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('từ chối dùng điểm nếu mức tối đa trên đơn dưới 100', async () => {
      prisma.product.findUnique.mockResolvedValue({ price: 5099 });
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 500 });

      await expect(
        service.previewCheckout('user-1', items, undefined, true),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('tính ship 15.000đ với tiền món dưới 100.000đ', async () => {
      prisma.product.findUnique.mockResolvedValue({ price: 80000 });

      const result = await service.previewCheckout(
        'user-1',
        items,
        undefined,
        false,
      );

      expect(result.shippingFee).toBe(15000);
      expect(result.total).toBe(95000);
    });
  });

  describe('giữ, nhả và hoàn điểm thưởng', () => {
    it('giữ điểm của đơn chờ thanh toán', async () => {
      prisma.order.findUnique.mockResolvedValue({
        userId: 'user-1',
        pointsUsed: 200,
      });

      await service.reservePendingPoints(prisma as never, 'order-1');

      expect(prisma.$executeRaw).toHaveBeenCalled();
    });

    it('không giữ điểm khi đơn không tồn tại hoặc không dùng điểm', async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ userId: 'user-1', pointsUsed: 0 });

      await service.reservePendingPoints(prisma as never, 'missing-order');
      await service.reservePendingPoints(prisma as never, 'order-2');

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('nhả điểm đã giữ, không nhả vượt quá số điểm đang giữ', async () => {
      prisma.order.findUnique.mockResolvedValue({
        userId: 'user-1',
        pointsUsed: 200,
      });
      await service.releasePendingPoints(prisma as never, 'order-1');

      expect(prisma.$executeRaw).toHaveBeenCalled();
    });

    it('hoàn điểm khi hủy đơn đã dùng điểm', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 50,
      });
      prisma.user.findUnique.mockResolvedValue({
        loyaltyPoints: 30,
        reservedPoints: 0,
        pointsOwed: 0,
      });
      prisma.loyaltyTransaction.findMany.mockResolvedValue([
        { reason: 'REDEEM', points: -50 },
      ]);

      await service.refundUsedPoints(prisma as never, 'order-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { loyaltyPoints: 80, pointsOwed: 0 },
      });
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          points: 50,
          reason: 'REDEEM_REFUND',
          orderId: 'order-1',
        },
      });
    });

    it('thu hồi điểm đã kiếm khi hủy đơn; phần thiếu thành điểm nợ', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 0,
      });
      prisma.user.findUnique.mockResolvedValue({
        loyaltyPoints: 20,
        reservedPoints: 10,
        pointsOwed: 0,
      });
      prisma.loyaltyTransaction.findMany.mockResolvedValue([
        { reason: 'ORDER_PAID', points: 50 },
      ]);

      await service.refundUsedPoints(prisma as never, 'order-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { loyaltyPoints: 10, pointsOwed: 40 },
      });
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          points: -10,
          reason: 'EARN_REVOKE',
          orderId: 'order-1',
        },
      });
    });

    it('không thu hồi điểm lần hai nếu đơn đã có giao dịch thu hồi', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 0,
      });
      prisma.user.findUnique.mockResolvedValue({
        loyaltyPoints: 100,
        reservedPoints: 0,
        pointsOwed: 0,
      });
      prisma.loyaltyTransaction.findMany.mockResolvedValue([
        { reason: 'ORDER_PAID', points: 50 },
        { reason: 'EARN_REVOKE', points: -50 },
      ]);

      await service.refundUsedPoints(prisma as never, 'order-1');

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.loyaltyTransaction.create).not.toHaveBeenCalled();
    });

    it('hoàn điểm đã dùng để thanh toán nợ trước khi cộng vào số dư khả dụng', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 50,
      });
      prisma.user.findUnique.mockResolvedValue({
        loyaltyPoints: 20,
        reservedPoints: 0,
        pointsOwed: 30,
      });
      prisma.loyaltyTransaction.findMany.mockResolvedValue([
        { reason: 'REDEEM', points: -50 },
      ]);

      await service.refundUsedPoints(prisma as never, 'order-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { loyaltyPoints: 40, pointsOwed: 0 },
      });
      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          points: -30,
          reason: 'EARN_REVOKE',
        },
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('settlePaidOrder (chỉ chạy khi đơn lên PAID)', () => {
    it('trừ điểm đã dùng và cộng điểm theo số tiền thực trả', async () => {
      prisma.loyaltyTransaction.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 5000 });

      await service.settlePaidOrder(prisma as never, {
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 1000,
        amountPaid: 80000,
      });

      expect(prisma.loyaltyTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 'user-1',
          points: -1000,
          reason: 'REDEEM',
          orderId: 'order-1',
        },
      });
      expect(prisma.loyaltyTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId: 'user-1',
          points: 80,
          reason: 'ORDER_PAID',
          orderId: 'order-1',
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { loyaltyPoints: 4080 },
      });
    });

    it('quyết toán được điểm đã giữ cho chính đơn đang thanh toán', async () => {
      prisma.loyaltyTransaction.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({
        loyaltyPoints: 500,
        reservedPoints: 100,
        pointsOwed: 0,
      });

      await service.settlePaidOrder(prisma as never, {
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 100,
        amountPaid: 10000,
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { loyaltyPoints: 410 },
      });
    });

    it('không dùng điểm: chỉ cộng điểm', async () => {
      prisma.loyaltyTransaction.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 100 });

      await service.settlePaidOrder(prisma as never, {
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 0,
        amountPaid: 35000,
      });

      expect(prisma.loyaltyTransaction.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { loyaltyPoints: 135 },
      });
    });

    it('dùng điểm tích được để trả nợ trước, chỉ cộng phần còn lại', async () => {
      prisma.loyaltyTransaction.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({
        loyaltyPoints: 100,
        reservedPoints: 0,
        pointsOwed: 40,
      });

      await service.settlePaidOrder(prisma as never, {
        id: 'order-2',
        userId: 'user-1',
        pointsUsed: 0,
        amountPaid: 50000,
      });

      expect(prisma.loyaltyTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 'user-1',
          points: 10,
          reason: 'ORDER_PAID',
          orderId: 'order-2',
        },
      });
      expect(prisma.loyaltyTransaction.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId: 'user-1',
          points: -40,
          reason: 'DEBT_SETTLEMENT',
          orderId: 'order-2',
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          loyaltyPoints: 110,
          pointsOwed: { decrement: 40 },
        },
      });
    });

    it('đơn có mã giảm giá: ghi nhận lượt dùng mã', async () => {
      prisma.order.findUnique.mockResolvedValue({ promotionId: 'promo-1' });
      prisma.loyaltyTransaction.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 0 });

      await service.settlePaidOrder(prisma as never, {
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 0,
        amountPaid: 90000,
      });

      expect(prisma.promotionUsage.createMany).toHaveBeenCalledWith({
        data: [
          { promotionId: 'promo-1', userId: 'user-1', orderId: 'order-1' },
        ],
        skipDuplicates: true,
      });
    });

    it('đơn không có mã: không ghi lượt dùng', async () => {
      prisma.order.findUnique.mockResolvedValue({ promotionId: null });
      prisma.loyaltyTransaction.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 0 });

      await service.settlePaidOrder(prisma as never, {
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 0,
        amountPaid: 90000,
      });

      expect(prisma.promotionUsage.createMany).not.toHaveBeenCalled();
    });

    it('đã quyết toán rồi thì không cộng/trừ lần 2', async () => {
      prisma.loyaltyTransaction.findFirst.mockResolvedValue({ id: 'tx-1' });

      await service.settlePaidOrder(prisma as never, {
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 1000,
        amountPaid: 80000,
      });

      expectNothingConsumed();
    });

    it('số dư không đủ (đua nhau): không trừ quá số dư, không âm', async () => {
      prisma.loyaltyTransaction.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 5 });

      await service.settlePaidOrder(prisma as never, {
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 200,
        amountPaid: 10000,
      });

      expect(prisma.loyaltyTransaction.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 'user-1',
          points: -5,
          reason: 'REDEEM',
          orderId: 'order-1',
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { loyaltyPoints: 10 },
      });
    });

    it('đơn dưới 1.000đ không được cộng điểm', async () => {
      prisma.loyaltyTransaction.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 100 });

      await service.settlePaidOrder(prisma as never, {
        id: 'order-1',
        userId: 'user-1',
        pointsUsed: 0,
        amountPaid: 900,
      });

      expect(prisma.loyaltyTransaction.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('validateBeforePayment', () => {
    const discounted = {
      id: 'order-1',
      userId: 'user-1',
      status: 'PAYMENT_FAILED' as const,
      total: 90000,
      shippingFee: 0,
      promotionId: 'promo-1',
      discountAmount: 10000,
      pointsUsed: 0,
      pointsDiscount: 0,
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
    };

    it('đơn không có mã và điểm: qua', async () => {
      await expect(
        service.validateBeforePayment(prisma as never, {
          ...discounted,
          promotionId: null,
          discountAmount: 0,
          total: 100000,
        }),
      ).resolves.toBeUndefined();
    });

    it('mã còn hợp lệ: qua', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);

      await expect(
        service.validateBeforePayment(prisma as never, discounted),
      ).resolves.toBeUndefined();
    });

    it('kiểm tra minOrder theo tiền món, không tính shippingFee', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...promotion,
        minOrder: 100000,
      });

      await expect(
        service.validateBeforePayment(prisma as never, {
          ...discounted,
          total: 95000,
          discountAmount: 10000,
          shippingFee: 15000,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('mã đã hết hạn => 409, yêu cầu áp lại', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...promotion,
        expiredAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.validateBeforePayment(prisma as never, discounted),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('tài khoản đã dùng mã ở đơn khác => 409', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);
      prisma.promotionUsage.findUnique.mockResolvedValue({
        orderId: 'order-other',
      });

      await expect(
        service.validateBeforePayment(prisma as never, discounted),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lượt dùng của chính đơn này không bị tính (thanh toán lại)', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);
      prisma.promotionUsage.findUnique.mockResolvedValue({
        orderId: 'order-1',
      });

      await expect(
        service.validateBeforePayment(prisma as never, discounted),
      ).resolves.toBeUndefined();
    });

    it('mã hết lượt => 409', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...promotion,
        usageLimit: 3,
      });
      prisma.order.count.mockResolvedValueOnce(0).mockResolvedValueOnce(3);

      await expect(
        service.validateBeforePayment(prisma as never, discounted),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('khách có đơn PENDING khác (tạo trước) giữ mã => 409', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);
      prisma.order.count.mockResolvedValueOnce(1);

      await expect(
        service.validateBeforePayment(prisma as never, discounted),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('chỉ đơn PENDING tạo trước mới giữ chỗ trước, và loại trừ chính đơn này', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...promotion,
        usageLimit: 3,
      });

      await service.validateBeforePayment(prisma as never, discounted);

      const before = {
        OR: [
          { createdAt: { lt: discounted.createdAt } },
          { createdAt: discounted.createdAt, id: { lt: 'order-1' } },
        ],
      };

      expect(prisma.order.count).toHaveBeenLastCalledWith({
        where: {
          promotionId: 'promo-1',
          id: { not: 'order-1' },
          OR: [
            { status: { in: ['PAID', 'PREPARING', 'READY', 'COMPLETED'] } },
            { status: { in: ['PENDING'] }, ...before },
          ],
        },
      });
    });

    it('khóa dòng mã trước khi kiểm tra để thanh toán đồng thời được xử lý lần lượt', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);

      await service.validateBeforePayment(prisma as never, discounted);

      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('mã bị xóa => 409', async () => {
      prisma.promotion.findUnique.mockResolvedValue(null);

      await expect(
        service.validateBeforePayment(prisma as never, discounted),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('điểm hiện có không đủ => 409', async () => {
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 5 });

      await expect(
        service.validateBeforePayment(prisma as never, {
          ...discounted,
          promotionId: null,
          pointsUsed: 200,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('điểm đang giữ ở đơn khác không được tính là điểm khả dụng', async () => {
      prisma.user.findUnique.mockResolvedValue({
        loyaltyPoints: 500,
        reservedPoints: 400,
      });

      await expect(
        service.validateBeforePayment(prisma as never, {
          ...discounted,
          promotionId: null,
          pointsUsed: 200,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('điểm nợ không được tính là điểm khả dụng', async () => {
      prisma.user.findUnique.mockResolvedValue({
        loyaltyPoints: 500,
        reservedPoints: 0,
        pointsOwed: 400,
      });

      await expect(
        service.validateBeforePayment(prisma as never, {
          ...discounted,
          promotionId: null,
          pointsUsed: 200,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('đủ điểm: qua', async () => {
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 500 });

      await expect(
        service.validateBeforePayment(prisma as never, {
          ...discounted,
          promotionId: null,
          pointsUsed: 200,
        }),
      ).resolves.toBeUndefined();
    });

    it('không tính reservation điểm của chính đơn PENDING là điểm của đơn khác', async () => {
      prisma.user.findUnique.mockResolvedValue({
        loyaltyPoints: 500,
        reservedPoints: 200,
      });

      await expect(
        service.validateBeforePayment(prisma as never, {
          ...discounted,
          status: 'PENDING',
          promotionId: null,
          pointsUsed: 200,
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  describe('getLoyalty', () => {
    it('trả số điểm và lịch sử điểm', async () => {
      prisma.user.findUnique.mockResolvedValue({
        loyaltyPoints: 135,
        reservedPoints: 35,
        pointsOwed: 10,
      });
      prisma.loyaltyTransaction.findMany.mockResolvedValue([
        { id: 'tx-1', points: 35 },
      ]);

      const result = await service.getLoyalty('user-1');

      expect(result.points).toBe(135);
      expect(result.availablePoints).toBe(90);
      expect(result.reservedPoints).toBe(35);
      expect(result.pointsOwed).toBe(10);
      expect(result.pointValueVnd).toBe(1);
      expect(result.transactions).toHaveLength(1);
    });

    it('không tìm thấy người dùng => 404', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getLoyalty('user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
