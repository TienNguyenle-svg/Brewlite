import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: {} }, // Mock PrismaService
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.each([
    undefined,
    [],
    [{ ingredientId: '', amount: 10 }],
    [{ ingredientId: 'ingredient-1', amount: 0 }],
    [{ ingredientId: 'ingredient-1', amount: Infinity }],
    [{ ingredientId: 'ingredient-1', amount: 10 }, { ingredientId: 'ingredient-1', amount: 20 }],
  ].map((recipes) => ({ recipes })))('từ chối tạo sản phẩm thiếu hoặc sai nguyên liệu: %j', async ({ recipes }) => {
    await expect(service.createProduct({
      name: 'Cà phê', price: 30000, category: 'Cà phê', imageUrl: '/coffee.jpg', recipes,
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});
