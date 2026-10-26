import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu seed...');

  // 1. Xóa data cũ (theo thứ tự khóa ngoại)
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.orderItemTopping.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.product.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.user.deleteMany();

  // 2. Tạo User (Quan trọng: Phải có phần này để test API)
  const passwordHash = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: { email: 'customer@brewlite.com', passwordHash, role: 'CUSTOMER', loyaltyPoints: 100 },
  });
  await prisma.user.create({
    data: { email: 'admin@brewlite.com', passwordHash, role: 'ADMIN' },
  });
  console.log('Đã tạo User (customer@brewlite.com / 123456)');

  // 3. Tạo Product
  await prisma.product.createMany({
    data: [
      { name: 'Cà phê sữa', price: 35000, imageUrl: '/images/ca-phe-sua.jpg', stock: 100 },
      { name: 'Americano', price: 40000, imageUrl: '/images/americano.jpg', stock: 100 },
      { name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.jpg', stock: 100 },
      { name: 'Trà đào', price: 39000, imageUrl: '/images/tra-dao.jpg', stock: 100 },
    ],
  });
  console.log('Đã tạo 4 sản phẩm');

  // 4. Tạo Topping
  await prisma.topping.createMany({
    data: [
      { name: 'Trân châu', price: 5000 },
      { name: 'Kem', price: 7000 },
      { name: 'Thạch', price: 5000 },
    ],
  });
  console.log('Đã tạo 3 topping');

  // 5. Tạo Promotion
  await prisma.promotion.create({
    data: { code: 'WELCOME10', discount: 10, type: 'PERCENT', minOrder: 50000, active: true },
  });
  console.log('Đã tạo mã WELCOME10');

  console.log('===== SEED HOÀN TẤT =====');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });