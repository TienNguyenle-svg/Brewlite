import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      { name: 'Cà phê sữa', price: 35000, imageUrl: '/images/ca-phe-sua.jpg', stock: 100 },
      { name: 'Americano', price: 40000, imageUrl: '/images/americano.jpg', stock: 100 },
      { name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.jpg', stock: 100 },
      { name: 'Trà đào', price: 39000, imageUrl: '/images/tra-dao.jpg', stock: 100 },
    ],
  });
  console.log('Seed done!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());