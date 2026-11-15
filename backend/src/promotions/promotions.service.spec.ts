import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PromotionsService } from './promotions.service';

describe('PromotionsService', () => {
  let service: PromotionsService;

  const prisma = {
    promotion: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const PAID_STATUSES = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];

  const existing = {
    id: 'promo-1',
    code: 'WE10',
    type: 'PERCENT',
    discount: 10,
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
    prisma.order.count.mockResolvedValue(0);
    prisma.order.groupBy.mockResolvedValue([]);
    prisma.promotion.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...existing, ...data }),
    );
    service = new PromotionsService(prisma as unknown as PrismaService);
  });

  // ---------------------------------------------------------------------------
  describe('create', () => {
    const dto: CreatePromotionDto = {
      code: '  we10 ',
      type: 'PERCENT',
      discount: 10,
    };

    beforeEach(() => {
      prisma.promotion.findUnique.mockResolvedValue(null);
      prisma.promotion.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 'promo-new', active: true, ...data }),
      );
    });

    it('chuẩn hóa code thành chữ HOA và gán giá trị mặc định', async () => {
      await service.create(dto);

      expect(prisma.promotion.findUnique).toHaveBeenCalledWith({
        where: { code: 'WE10' },
      });
      expect(prisma.promotion.create).toHaveBeenCalledWith({
        data: {
          code: 'WE10',
          type: 'PERCENT',
          discount: 10,
          minOrder: 0,
          startAt: null,
          expiredAt: null,
          usageLimit: null,
        },
      });
    });

    it('lưu đủ ngày bắt đầu, ngày kết thúc, số lượng và đơn tối thiểu', async () => {
      await service.create({
        ...dto,
        minOrder: 50000,
        startAt: '2026-11-10T00:00:00.000Z',
        expiredAt: '2026-12-31T00:00:00.000Z',
        usageLimit: 100,
      });

      expect(prisma.promotion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          minOrder: 50000,
          startAt: new Date('2026-11-10T00:00:00.000Z'),
          expiredAt: new Date('2026-12-31T00:00:00.000Z'),
          usageLimit: 100,
        }),
      });
    });

    it('cho phép FIXED với số tiền lớn hơn 100', async () => {
      await expect(
        service.create({ ...dto, type: 'FIXED', discount: 20000 }),
      ).resolves.toBeDefined();
    });

    it('code đang thuộc một mã còn bật => 409, không tạo, không đổi tên mã cũ', async () => {
      prisma.promotion.findUnique.mockResolvedValue(existing);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.promotion.update).not.toHaveBeenCalled();
      expect(prisma.promotion.create).not.toHaveBeenCalled();
    });

    it('code đang thuộc một mã đã tắt => đổi tên mã cũ rồi tạo mã mới cùng code', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...existing,
        id: 'abcdef12-0000-0000-0000-000000000000',
        active: false,
      });

      await service.create(dto);

      expect(prisma.promotion.update).toHaveBeenCalledWith({
        where: { id: 'abcdef12-0000-0000-0000-000000000000' },
        data: { code: 'WE10~abcdef12' },
      });
      expect(prisma.promotion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ code: 'WE10' }),
      });
      // Phải nhường code trước khi tạo mã mới, nếu không sẽ vướng ràng buộc unique.
      expect(prisma.promotion.update.mock.invocationCallOrder[0]).toBeLessThan(
        prisma.promotion.create.mock.invocationCallOrder[0],
      );
    });

    it('2 request tạo cùng code song song: request đến sau => 409', async () => {
      prisma.promotion.findUnique.mockResolvedValue(null);
      prisma.promotion.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('PERCENT vượt quá 100 => 400', async () => {
      await expect(
        service.create({ ...dto, discount: 101 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.promotion.create).not.toHaveBeenCalled();
    });

    it('ngày bắt đầu không trước ngày kết thúc => 400', async () => {
      await expect(
        service.create({
          ...dto,
          startAt: '2026-12-31T00:00:00.000Z',
          expiredAt: '2026-11-10T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      await expect(
        service.create({
          ...dto,
          startAt: '2026-11-10T00:00:00.000Z',
          expiredAt: '2026-11-10T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('tính usedCount, reservedCount và remaining theo trạng thái đơn', async () => {
      prisma.promotion.count.mockResolvedValue(2);
      prisma.promotion.findMany.mockResolvedValue([
        { ...existing, id: 'p1', usageLimit: 10 },
        { ...existing, id: 'p2', code: 'FREE', usageLimit: null },
      ]);
      prisma.order.groupBy.mockResolvedValue([
        { promotionId: 'p1', status: 'PAID', _count: { _all: 3 } },
        { promotionId: 'p1', status: 'COMPLETED', _count: { _all: 2 } },
        { promotionId: 'p1', status: 'PENDING', _count: { _all: 1 } },
      ]);

      const result = await service.findAll(1, 20);

      expect(result.total).toBe(2);
      expect(result.items[0]).toMatchObject({
        id: 'p1',
        usedCount: 5,
        reservedCount: 1,
        remaining: 4,
      });
      expect(result.items[1]).toMatchObject({
        id: 'p2',
        usedCount: 0,
        reservedCount: 0,
        remaining: null,
      });
    });

    it('remaining không âm', async () => {
      prisma.promotion.count.mockResolvedValue(1);
      prisma.promotion.findMany.mockResolvedValue([
        { ...existing, id: 'p1', usageLimit: 2 },
      ]);
      prisma.order.groupBy.mockResolvedValue([
        { promotionId: 'p1', status: 'PAID', _count: { _all: 5 } },
      ]);

      const result = await service.findAll();

      expect(result.items[0].remaining).toBe(0);
    });

    it('chỉ đếm đơn đã thanh toán và PENDING, bỏ PAYMENT_FAILED / CANCELLED', async () => {
      prisma.promotion.count.mockResolvedValue(1);
      prisma.promotion.findMany.mockResolvedValue([{ ...existing, id: 'p1' }]);

      await service.findAll();

      expect(prisma.order.groupBy).toHaveBeenCalledWith({
        by: ['promotionId', 'status'],
        where: {
          promotionId: { in: ['p1'] },
          status: { in: [...PAID_STATUSES, 'PENDING'] },
        },
        _count: { _all: true },
      });
    });

    it('không có mã nào thì không truy vấn đơn hàng', async () => {
      prisma.promotion.count.mockResolvedValue(0);
      prisma.promotion.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual({ items: [], total: 0, page: 1, limit: 20 });
      expect(prisma.order.groupBy).not.toHaveBeenCalled();
    });

    it('phân trang: bỏ qua đúng số bản ghi, giới hạn tối đa 100 mỗi trang', async () => {
      prisma.promotion.count.mockResolvedValue(0);
      prisma.promotion.findMany.mockResolvedValue([]);

      await service.findAll(3, 20);
      expect(prisma.promotion.findMany).toHaveBeenLastCalledWith({
        orderBy: { code: 'asc' },
        skip: 40,
        take: 20,
      });

      const result = await service.findAll(0, 500);
      expect(prisma.promotion.findMany).toHaveBeenLastCalledWith({
        orderBy: { code: 'asc' },
        skip: 0,
        take: 100,
      });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(100);
    });
  });

  // ---------------------------------------------------------------------------
  describe('update', () => {
    beforeEach(() => {
      prisma.promotion.findUnique.mockResolvedValue(existing);
    });

    it('không tìm thấy => 404', async () => {
      prisma.promotion.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nope', { discount: 20 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.promotion.update).not.toHaveBeenCalled();
    });

    it('chỉ đổi trường được gửi, giữ nguyên ngày và số lượng hiện có', async () => {
      const startAt = new Date('2026-11-10T00:00:00.000Z');
      const expiredAt = new Date('2026-12-31T00:00:00.000Z');
      prisma.promotion.findUnique.mockResolvedValue({
        ...existing,
        startAt,
        expiredAt,
        usageLimit: 50,
      });

      await service.update('promo-1', { discount: 20 });

      expect(prisma.promotion.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { discount: 20, startAt, expiredAt, usageLimit: 50 },
      });
    });

    it('gửi null để xóa ngày bắt đầu, ngày kết thúc và số lượng', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...existing,
        startAt: new Date('2026-11-10T00:00:00.000Z'),
        expiredAt: new Date('2026-12-31T00:00:00.000Z'),
        usageLimit: 50,
      });

      await service.update('promo-1', {
        startAt: null,
        expiredAt: null,
        usageLimit: null,
      });

      expect(prisma.promotion.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { startAt: null, expiredAt: null, usageLimit: null },
      });
      expect(prisma.order.count).not.toHaveBeenCalled();
    });

    it('không bật lại mã đã lưu trữ (code có dấu ~) => 400', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...existing,
        code: 'WE10~abcdef12',
        active: false,
      });

      await expect(
        service.update('promo-1', { active: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.promotion.update).not.toHaveBeenCalled();
    });

    it('bật / tắt mã bằng active', async () => {
      await service.update('promo-1', { active: false });

      expect(prisma.promotion.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: expect.objectContaining({ active: false }),
      });
    });

    it('số lượng nhỏ hơn số lượt đang chiếm => 400', async () => {
      prisma.order.count.mockResolvedValue(8);

      await expect(
        service.update('promo-1', { usageLimit: 5 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.promotion.update).not.toHaveBeenCalled();
    });

    it('số lượng bằng số lượt đang chiếm => qua', async () => {
      prisma.order.count.mockResolvedValue(5);

      await expect(
        service.update('promo-1', { usageLimit: 5 }),
      ).resolves.toBeDefined();
    });

    it('lượt đang chiếm = đơn đã thanh toán + đơn PENDING', async () => {
      await service.update('promo-1', { usageLimit: 5 });

      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          promotionId: 'promo-1',
          status: { in: [...PAID_STATUSES, 'PENDING'] },
        },
      });
    });

    it('mã PERCENT sửa lên trên 100 => 400, mã FIXED thì được', async () => {
      await expect(
        service.update('promo-1', { discount: 150 }),
      ).rejects.toBeInstanceOf(BadRequestException);

      prisma.promotion.findUnique.mockResolvedValue({
        ...existing,
        type: 'FIXED',
        discount: 20000,
      });

      await expect(
        service.update('promo-1', { discount: 150000 }),
      ).resolves.toBeDefined();
    });

    it('ngày bắt đầu mới không trước ngày kết thúc hiện có => 400', async () => {
      prisma.promotion.findUnique.mockResolvedValue({
        ...existing,
        expiredAt: new Date('2026-11-30T00:00:00.000Z'),
      });

      await expect(
        service.update('promo-1', { startAt: '2026-12-15T00:00:00.000Z' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('xóa mềm: chỉ đặt active = false, không xóa bản ghi', async () => {
      prisma.promotion.findUnique.mockResolvedValue(existing);

      const result = await service.remove('promo-1');

      expect(prisma.promotion.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { active: false },
      });
      expect(result.active).toBe(false);
    });

    it('không tìm thấy => 404', async () => {
      prisma.promotion.findUnique.mockResolvedValue(null);

      await expect(service.remove('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.promotion.update).not.toHaveBeenCalled();
    });
  });
});