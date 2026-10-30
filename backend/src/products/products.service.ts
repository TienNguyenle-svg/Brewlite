import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(sort?: string) {
    let orderBy: any = { name: 'asc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };

    const products = await this.prisma.product.findMany({
      orderBy,
      include: {
        recipes: {
          include: { ingredient: true }, // Lấy thông tin nguyên liệu để check kho
        },
      },
    });

    // Thuật toán kiểm tra xem món nào sắp hết hàng
    return products.map((product) => {
      let isAvailable = true;
      let maxServings = 9999;

      // Duyệt qua từng nguyên liệu của món
      for (const recipe of product.recipes) {
        const possibleServings = Math.floor(recipe.ingredient.stock / recipe.amount);
        if (possibleServings < maxServings) {
          maxServings = possibleServings;
        }
      }

      if (maxServings <= 0) isAvailable = false;

      return {
        ...product,
        isAvailable, // Trả về trạng thái Còn/Hết hàng
      };
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { toppings: true, recipes: { include: { ingredient: true } } },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }
}