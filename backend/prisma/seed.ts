import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Xóa data cũ
  await prisma.orderItemTopping.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.product.deleteMany();

  // Thêm sản phẩm
  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Cà phê sữa', price: 35000, imageUrl: '/images/ca-phe-sua.jpg', stock: 100 } }),
    prisma.product.create({ data: { name: 'Americano', price: 40000, imageUrl: '/images/americano.jpg', stock: 100 } }),
    prisma.product.create({ data: { name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.jpg', stock: 100 } }),
    prisma.product.create({ data: { name: 'Trà đào', price: 39000, imageUrl: '/images/tra-dao.jpg', stock: 100 } }),
  ]);

  // Thêm topping
  await prisma.topping.createMany({
    data: [
      { name: 'Trân châu', price: 5000 },
      { name: 'Kem', price: 7000 },
      { name: 'Thạch', price: 5000 },
    ],
  });

  // Thêm promotion mẫu
  await prisma.promotion.create({
    data: {
      code: 'WELCOME10',
      discount: 10,
      type: 'PERCENT',
      minOrder: 50000,
      active: true,
    },
  });

  console.log('Seed done!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());