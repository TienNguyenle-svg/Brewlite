import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const user = await this.prisma.user.findFirst();
    if (!user) throw new BadRequestException('Chưa có user trong DB');

    let total = 0;
    const orderItems: any[] = [];

    // Hệ số nhân theo Size
    const getSizeMultiplier = (size: string) => {
      if (size === 'S') return 0.8;
      if (size === 'L') return 1.2;
      return 1.0; // Size M
    };

    // 1. Kiểm tra sản phẩm, nguyên liệu và tính tiền
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { recipes: true },
      });
      if (!product) throw new BadRequestException('Sản phẩm không tồn tại');

      const multiplier = getSizeMultiplier(item.size);

      // 1.1 Kiểm tra kho nguyên liệu của món chính
      for (const recipe of product.recipes) {
        const ingredient = await this.prisma.ingredient.findUnique({ where: { id: recipe.ingredientId } });
        const neededAmount = recipe.amount * multiplier * item.qty;
        if (!ingredient || ingredient.stock < neededAmount) {
          throw new BadRequestException(`Hết nguyên liệu làm món ${product.name} (Size ${item.size})`);
        }
      }

      // 1.2 Tính tiền topping
      let toppingPriceTotal = 0;
      const itemToppingsData: any[] = [];
      
      if (item.toppingIds && item.toppingIds.length > 0) {
        const toppings = await this.prisma.topping.findMany({
          where: { id: { in: item.toppingIds } },
        });

        for (const topping of toppings) {
          toppingPriceTotal += topping.price;
          itemToppingsData.push({
            toppingId: topping.id,
            price: topping.price,
          });
        }
      }

      // 1.3 Tính giá tiền theo hệ số Size
      // Giá gốc của món được nhân với hệ số Size (S: 0.8, M: 1.0, L: 1.2)
      const finalProductPrice = Math.round(product.price * multiplier); 
      
      // Giá cuối cùng = (Giá sản phẩm sau khi nhân size + Tiền topping) * Số lượng
      const lineTotal = (finalProductPrice + toppingPriceTotal) * item.qty;
      
      total += lineTotal;
      
      orderItems.push({ 
        productId: item.productId, 
        size: item.size, 
        qty: item.qty, 
        unitPrice: finalProductPrice, // Lưu giá đã nhân hệ số vào DB
        lineTotal,
        toppings: {
          create: itemToppingsData, // Lưu topping vào bảng OrderItemTopping
        }
      });
    }

    // 2. Tạo đơn và trừ kho nguyên liệu
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.create({
        data: { userId: user.id, total, status: 'PENDING', items: { create: orderItems } },
        include: { items: { include: { toppings: true } } },
      });

      for (const item of dto.items) {
        // Cộng lượt bán
        await prisma.product.update({
          where: { id: item.productId },
          data: { soldCount: { increment: item.qty } },
        });

        // Trừ kho nguyên liệu món chính
        const product = await prisma.product.findUnique({
          where: { id: item.productId }, include: { recipes: true }
        });
        
        if (product) {
          const multiplier = getSizeMultiplier(item.size);
          for (const recipe of product.recipes) {
            const amountToSubtract = recipe.amount * multiplier * item.qty;
            await prisma.ingredient.update({
              where: { id: recipe.ingredientId },
              data: { stock: { decrement: amountToSubtract } },
            });
          }
        }
      }
      return order;
    });
  }

  async findMyOrders() {
    const user = await this.prisma.user.findFirst();
    if (!user) return [];
    return this.prisma.order.findMany({
      where: { userId: user.id },
      include: { items: { include: { toppings: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}