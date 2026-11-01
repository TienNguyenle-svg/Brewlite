import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaristaOrderStatus } from './dto/update-barista-order-status.dto';

@Injectable()
export class BaristaService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrders() {
    return this.prisma.order.findMany({
      where: {
        status: {
          in: [
            OrderStatus.PAID,
            OrderStatus.PREPARING,
            OrderStatus.READY,
          ],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
            toppings: {
              include: {
                topping: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateOrderStatus(
    id: string,
    targetStatus: BaristaOrderStatus,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const allowedNextStatus: Partial<
      Record<OrderStatus, BaristaOrderStatus>
    > = {
      [OrderStatus.PAID]: BaristaOrderStatus.PREPARING,
      [OrderStatus.PREPARING]: BaristaOrderStatus.READY,
      [OrderStatus.READY]: BaristaOrderStatus.COMPLETED,
    };

    if (allowedNextStatus[order.status] !== targetStatus) {
      throw new BadRequestException(
        `Không thể chuyển đơn hàng từ ${order.status} sang ${targetStatus}`,
      );
    }

    const result = await this.prisma.order.updateMany({
      where: {
        id,
        status: order.status,
      },
      data: {
        status: targetStatus as OrderStatus,
      },
    });

    if (result.count === 0) {
      throw new ConflictException(
        'Đơn hàng đã được cập nhật bởi người khác. Vui lòng tải lại danh sách.',
      );
    }

    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
            toppings: {
              include: {
                topping: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}