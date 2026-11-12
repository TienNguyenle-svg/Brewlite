import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService
  ) {}

  private getSizeMultiplier(size: string) {
    if (size === 'S') return 0.8;
    if (size === 'L') return 1.2;
    return 1.0;
  }

  async create(dto: CreateOrderDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User không hợp lệ');

    let subTotal = 0;
    const orderItems: any[] = [];

    // 1. Tính tiền món
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) throw new BadRequestException('Sản phẩm không tồn tại');

      const multiplier = this.getSizeMultiplier(item.size);

      let toppingPriceTotal = 0;
      const itemToppingsData: any[] = [];
      if (item.toppingIds && item.toppingIds.length > 0) {
        const toppings = await this.prisma.topping.findMany({ where: { id: { in: item.toppingIds } } });
        for (const topping of toppings) {
          toppingPriceTotal += topping.price;
          itemToppingsData.push({ toppingId: topping.id, price: topping.price });
        }
      }

      const finalProductPrice = Math.round(product.price * multiplier);
      const lineTotal = (finalProductPrice * item.qty) + toppingPriceTotal;
      subTotal += lineTotal;

      orderItems.push({
        productId: item.productId, size: item.size, qty: item.qty,
        unitPrice: finalProductPrice, lineTotal,
        toppings: { create: itemToppingsData }
      });
    }

    // 2. Xác thực mã khuyến mãi
    let discountAmount = 0;
    let promotionId = null;

    if (dto.promotionCode) {
      const promo = await this.prisma.promotion.findUnique({ where: { code: dto.promotionCode } });
      if (!promo || !promo.active || (promo.expiredAt && promo.expiredAt < new Date())) {
        throw new BadRequestException('Mã không hợp lệ hoặc đã hết hạn');
      }
      if (subTotal < promo.minOrder) {
        throw new BadRequestException(`Đơn hàng chưa đạt tối thiểu ${promo.minOrder}đ`);
      }
      discountAmount = promo.type === 'PERCENT' ? Math.round((subTotal * promo.discount) / 100) : promo.discount;
      promotionId = promo.id;
    }

    // 3. XỬ LÝ ĐIỂM THƯỞNG: 1 điểm = 1đ, tối thiểu 100 điểm mới được dùng
    let pointsDiscount = 0;
    let pointsUsed = 0;
    if (dto.usePoints === true) {
      if (user.loyaltyPoints < 100) {
        throw new BadRequestException('Cần tối thiểu 100 điểm thưởng để sử dụng tính năng này');
      }
      const maxAllowedDiscount = subTotal - discountAmount;
      pointsUsed = Math.min(user.loyaltyPoints, maxAllowedDiscount);
      pointsDiscount = pointsUsed; // 1 điểm = 1 VNĐ
    }

    const shippingFee = subTotal >= 100000 ? 0 : 15000;
    const finalTotal = subTotal - discountAmount - pointsDiscount + shippingFee;

    // 4. TRANSACTION: TẠO ĐƠN, GIỮ KHO VÀ GIỮ ĐIỂM
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          subtotal: subTotal, 
          total: finalTotal,
          shippingFee: shippingFee,
          discountAmount: discountAmount + pointsDiscount,
          pointsUsed: pointsUsed, 
          pointsDiscount: pointsDiscount,
          status: 'PENDING',
          items: { create: orderItems },
          receiverName: dto.receiverName,
          receiverPhone: dto.receiverPhone,
          deliveryAddress: dto.deliveryAddress,
          promotionId: promotionId,
        },
        include: { items: { include: { toppings: true } } },
      });

      // Giữ kho
      await this.inventoryService.reserveOrder(tx, newOrder.id);

      // Giữ điểm thưởng
      if (pointsUsed > 0) {
        const updated = await tx.$executeRaw`
          UPDATE "User"
          SET "reservedPoints" = "reservedPoints" + ${pointsUsed}
          WHERE "id" = ${user.id} AND ("loyaltyPoints" - "reservedPoints") >= ${pointsUsed}
        `;
        if (updated === 0) throw new BadRequestException('Không đủ điểm thưởng khả dụng.');
      }

      return newOrder;
    });
  }

  async markAsPaid(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.status !== 'PENDING') throw new BadRequestException('Đơn hàng không ở trạng thái chờ thanh toán');

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });

      await this.inventoryService.settleOrder(tx, orderId);

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { soldCount: { increment: item.qty } },
        });
      }

      // Trừ điểm đã dùng (nếu có)
      if (order.pointsUsed > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { 
            loyaltyPoints: { decrement: order.pointsUsed },
            reservedPoints: { decrement: order.pointsUsed }
          },
        });
        await tx.loyaltyTransaction.create({
          data: {
            userId: order.userId,
            points: -order.pointsUsed,
            reason: `Dùng điểm cho đơn ${order.id}`,
            orderId: order.id,
          }
        });
      }

      // CỘNG ĐIỂM THƯỞNG KHI THANH TOÁN THÀNH CÔNG: 1.000đ = 1 điểm
      const earnedPoints = Math.floor(order.subtotal / 1000);
      if (earnedPoints > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: {
            loyaltyPoints: { increment: earnedPoints }
          }
        });
        await tx.loyaltyTransaction.create({
          data: {
            userId: order.userId,
            points: earnedPoints,
            reason: `Cộng điểm tích lũy từ đơn ${order.id}`,
            orderId: order.id,
          }
        });
      }

      return updatedOrder;
    });
  }

  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ 
      where: { id: orderId },
      include: { items: true, payments: true } 
    });
    
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    
    if (order.status !== 'PAID' && order.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể hủy đơn PENDING hoặc PAID.');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (order.status === 'PAID') {
        await this.inventoryService.refundOrder(tx, orderId);

        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { soldCount: { decrement: item.qty } },
          });
        }

        const users = await tx.$queryRaw<any[]>`SELECT "loyaltyPoints", "pointsOwed" FROM "User" WHERE "id" = ${order.userId} FOR UPDATE`;
        
        if (users.length > 0) {
          let currentPoints = users[0].loyaltyPoints;
          let currentOwed = users[0].pointsOwed;

          const transactions = await tx.loyaltyTransaction.findMany({
            where: { orderId: order.id }
          });

          let totalRedeem = 0;
          let totalEarn = 0;

          transactions.forEach(t => {
            const reason = t.reason.toUpperCase();
            if (reason.includes('DÙNG ĐIỂM') || reason.includes('REDEEM')) {
              totalRedeem += t.points;
            } 
            else if (reason.includes('CỘNG ĐIỂM') || reason.includes('EARN') || reason.includes('TÍCH LŨY')) {
              totalEarn += t.points;
            }
          });

          // Hoàn lại điểm khách đã dùng lúc đặt hàng
          const pointsToRefund = -totalRedeem; 
          if (pointsToRefund > 0) {
            currentPoints += pointsToRefund;
            await tx.loyaltyTransaction.create({
              data: {
                userId: order.userId,
                points: pointsToRefund,
                reason: `REDEEM_REFUND: Hoàn điểm đã dùng cho đơn ${order.id}`,
                orderId: order.id,
              }
            });
          }

          // Thu hồi lại điểm đã cộng khi thanh toán thành công (nếu user không đủ điểm sẽ ghi nhận vào pointsOwed)
          const pointsToRevoke = totalEarn; 
          if (pointsToRevoke > 0) {
            const actualRevoke = Math.min(pointsToRevoke, currentPoints);
            const debt = pointsToRevoke - actualRevoke; 

            currentPoints -= actualRevoke;
            currentOwed += debt;

            if (actualRevoke > 0) {
              await tx.loyaltyTransaction.create({
                data: {
                  userId: order.userId,
                  points: -actualRevoke,
                  reason: `EARN_REVOKE: Thu hồi điểm cộng từ đơn ${order.id}`,
                  orderId: order.id,
                }
              });
            }
          }

          await tx.user.update({
            where: { id: order.userId },
            data: { 
              loyaltyPoints: currentPoints,
              pointsOwed: currentOwed 
            },
          });
        }

        const payment = order.payments[0];
        if (payment) {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'REFUNDED' } 
          });
        }
      } 
      else if (order.status === 'PENDING') {
        await this.inventoryService.releaseOrder(tx, orderId);

        if (order.pointsUsed > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { reservedPoints: { decrement: order.pointsUsed } }, 
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTimeoutPendingOrders() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: tenMinutesAgo },
      },
    });

    for (const order of expiredOrders) {
      try {
        await this.cancelOrder(order.id); 
      } catch (error) {
        console.error(`[Cronjob] Lỗi khi hủy đơn timeout ${order.id}:`, error);
      }
    }
  }

  async findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId: userId },
      include: { items: { include: { toppings: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}