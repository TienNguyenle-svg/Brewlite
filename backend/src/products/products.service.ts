import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(sort?: string) {
    // Mặc định sắp xếp bán chạy
    let orderBy: any = { soldCount: 'desc' }; 
    
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'name_asc') {
      orderBy = { name: 'asc' };
    }
    // Nếu sort === 'best_seller' hoặc không truyền gì -> orderBy = { soldCount: 'desc' }

    const products = await this.prisma.product.findMany({
      orderBy,
      include: {
        recipes: {
          include: { ingredient: true }, 
        },
      },
    });

    // Thuật toán kiểm tra xem món nào sắp hết hàng
    return products.map((product) => {
      let isAvailable = true;
      let maxServings = 9999;

      for (const recipe of product.recipes) {
        const possibleServings = Math.floor(recipe.ingredient.stock / recipe.amount);
        if (possibleServings < maxServings) {
          maxServings = possibleServings;
        }
      }

      if (maxServings <= 0) isAvailable = false;

      return {
        ...product,
        isAvailable, 
        // soldCount đã tự động có trong ...product do lấy từ DB
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