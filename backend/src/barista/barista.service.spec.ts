import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaristaService } from './barista.service';
import { BaristaOrderStatus } from './dto/update-barista-order-status.dto';

describe('BaristaService', () => {
  let service: BaristaService;

  const prismaMock = {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BaristaService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<BaristaService>(BaristaService);
  });

  describe('findOrders', () => {
    it('trả về danh sách đơn đang chờ pha chế', async () => {
      const orders = [
        { id: 'order-1', status: OrderStatus.PAID },
        { id: 'order-2', status: OrderStatus.PREPARING },
        { id: 'order-3', status: OrderStatus.READY },
      ];

      prismaMock.order.findMany.mockResolvedValue(orders);

      await expect(service.findOrders()).resolves.toEqual(orders);

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: {
              in: [
                OrderStatus.PAID,
                OrderStatus.PREPARING,
                OrderStatus.READY,
              ],
            },
          },
          orderBy: { createdAt: 'asc' },
        }),
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('chuyển PAID sang PREPARING thành công', async () => {
      prismaMock.order.findUnique
        .mockResolvedValueOnce({
          id: 'order-1',
          status: OrderStatus.PAID,
        })
        .mockResolvedValueOnce({
          id: 'order-1',
          status: OrderStatus.PREPARING,
        });

      prismaMock.order.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateOrderStatus(
        'order-1',
        BaristaOrderStatus.PREPARING,
      );

      expect(result).toEqual({
        id: 'order-1',
        status: OrderStatus.PREPARING,
      });

      expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'order-1',
          status: OrderStatus.PAID,
        },
        data: {
          status: OrderStatus.PREPARING,
        },
      });
    });

    it('báo lỗi khi không tìm thấy đơn hàng', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus(
          'missing-order',
          BaristaOrderStatus.PREPARING,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
    });

    it('từ chối chuyển trạng thái không hợp lệ', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PAID,
      });

      await expect(
        service.updateOrderStatus(
          'order-1',
          BaristaOrderStatus.READY,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
    });

    it('báo xung đột khi đơn bị cập nhật đồng thời', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PAID,
      });

      prismaMock.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateOrderStatus(
          'order-1',
          BaristaOrderStatus.PREPARING,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});