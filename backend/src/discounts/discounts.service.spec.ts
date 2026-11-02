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
    $transaction: jest.fn(),
  };

  const promotion = {
    id: 'promo-1',
    code: 'WELCOME10',
    discount: 10,
    type: 'PERCENT',
    minOrder: 50000,
    expiredAt: null as Date | null,
    active: true,
  };

  beforeEach(() => {
    jest.resetAllMocks();

    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => unknown) => callback(prisma),
    );
    prisma.$queryRaw.mockResolvedValue([]);
    prisma.payment.findFirst.mockResolvedValue(null);
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

    it('đã dùng mã ở đơn thanh toán thành công trước đó => 409', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);
      prisma.order.count.mockResolvedValue(1);

      await expect(
        service.previewCheckout('user-1', items, 'WELCOME10', false),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('chỉ tính các đơn đã thanh toán thành công là "đã dùng mã"', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);

      await service.previewCheckout('user-1', items, 'WELCOME10', false);

      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          promotionId: 'promo-1',
          status: { in: ['PAID', 'PREPARING', 'READY', 'COMPLETED'] },
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
      total: 90000,
      shippingFee: 0,
      promotionId: 'promo-1',
      discountAmount: 10000,
      pointsUsed: 0,
      pointsDiscount: 0,
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

    it('mã đã bị dùng ở đơn khác đã thanh toán => 409', async () => {
      prisma.promotion.findUnique.mockResolvedValue(promotion);
      prisma.order.count.mockResolvedValue(1);

      await expect(
        service.validateBeforePayment(prisma as never, discounted),
      ).rejects.toBeInstanceOf(ConflictException);
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
  });

  // ---------------------------------------------------------------------------
  describe('getLoyalty', () => {
    it('trả số điểm và lịch sử điểm', async () => {
      prisma.user.findUnique.mockResolvedValue({ loyaltyPoints: 135 });
      prisma.loyaltyTransaction.findMany.mockResolvedValue([
        { id: 'tx-1', points: 35 },
      ]);

      const result = await service.getLoyalty('user-1');

      expect(result.points).toBe(135);
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
