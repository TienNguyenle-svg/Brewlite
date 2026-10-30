
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu seed dữ liệu...');

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

  // 2. Tạo 3 tài khoản, dùng chung mật khẩu a123456
  const passwordHash = await bcrypt.hash('a123456', 10);

  const customer = await prisma.user.create({
    data: {
      email: 'customer@brewlite.com',
      passwordHash,
      role: 'CUSTOMER',
      loyaltyPoints: 100,
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@brewlite.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      email: 'barista@brewlite.com',
      passwordHash,
      role: 'BARISTA',
    },
  });

  console.log('- Đã tạo 3 tài khoản, mật khẩu: a123456');

  // 3. Tạo 20 món nước
  const productsData = [
    // Cà phê Việt Nam
    { name: 'Cà phê đen đá', price: 25000, imageUrl: '/images/ca-phe-den.jpg', stock: 100 },
    { name: 'Cà phê sữa đá', price: 30000, imageUrl: '/images/ca-phe-sua.jpg', stock: 100 },
    { name: 'Bạc xỉu', price: 35000, imageUrl: '/images/bac-xiu.jpg', stock: 100 },
    { name: 'Cà phê muối', price: 35000, imageUrl: '/images/ca-phe-muoi.jpg', stock: 100 },

    // Cà phê Ý
    { name: 'Espresso', price: 30000, imageUrl: '/images/espresso.jpg', stock: 100 },
    { name: 'Americano', price: 35000, imageUrl: '/images/americano.jpg', stock: 100 },
    { name: 'Latte', price: 45000, imageUrl: '/images/latte.jpg', stock: 100 },
    { name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.jpg', stock: 100 },
    { name: 'Mocha', price: 50000, imageUrl: '/images/mocha.jpg', stock: 100 },
    { name: 'Caramel Macchiato', price: 55000, imageUrl: '/images/macchiato.jpg', stock: 100 },

    // Trà và trà sữa
    { name: 'Trà đào cam sả', price: 45000, imageUrl: '/images/tra-dao.jpg', stock: 100 },
    { name: 'Trà sữa trân châu', price: 45000, imageUrl: '/images/tra-sua.jpg', stock: 100 },
    { name: 'Trà xanh matcha', price: 40000, imageUrl: '/images/matcha.jpg', stock: 100 },
    { name: 'Trà vải', price: 40000, imageUrl: '/images/tra-vai.jpg', stock: 100 },
    { name: 'Trà chanh', price: 25000, imageUrl: '/images/tra-chanh.jpg', stock: 100 },

    // Đá xay và sinh tố
    { name: 'Matcha đá xay', price: 55000, imageUrl: '/images/matcha-da-xay.jpg', stock: 100 },
    { name: 'Cookie đá xay', price: 55000, imageUrl: '/images/cookie-da-xay.jpg', stock: 100 },
    { name: 'Sinh tố bơ', price: 45000, imageUrl: '/images/sinh-to-bo.jpg', stock: 100 },

    // Khác
    { name: 'Sữa tươi trân châu đường đen', price: 50000, imageUrl: '/images/sua-tuoi.jpg', stock: 100 },
    { name: 'Nước ép cam', price: 35000, imageUrl: '/images/nuoc-cam.jpg', stock: 100 },
  ];

  await prisma.product.createMany({ data: productsData });

  const products = await prisma.product.findMany();
  const findProduct = (name: string) => {
    const product = products.find((p) => p.name === name);
    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm: ${name}`);
    }
    return product;
  };

  console.log(`- Đã tạo ${productsData.length} món nước`);

  // 4. Tạo 7 loại topping
  await prisma.topping.createMany({
    data: [
      { name: 'Trân châu đen', price: 5000 },
      { name: 'Trân châu trắng', price: 5000 },
      { name: 'Kem phô mai', price: 10000 },
      { name: 'Kem trứng khè', price: 10000 },
      { name: 'Thạch trái cây', price: 5000 },
      { name: 'Pudding trứng', price: 8000 },
      { name: 'Thạch dừa', price: 5000 },
    ],
  });

  console.log('- Đã tạo 7 loại topping');

  // 5. Tạo mã khuyến mãi
  await prisma.promotion.create({
    data: {
      code: 'WELCOME10',
      discount: 10,
      type: 'PERCENT',
      minOrder: 50000,
      active: true,
    },
  });
  console.log('- Đã tạo User test: customer@brewlite.com / 123456');

  console.log('- Đã tạo mã khuyến mãi WELCOME10');

  // 6. Tạo 3 đơn hàng PENDING và 3 payment PENDING
  const orderSeeds = [
    { productName: 'Cà phê sữa đá', key: 'seed-payment-pending-001' },
    { productName: 'Americano', key: 'seed-payment-pending-002' },
    { productName: 'Cappuccino', key: 'seed-payment-pending-003' },
  ];

  for (const item of orderSeeds) {
    const product = findProduct(item.productName);

    await prisma.order.create({
      data: {
        userId: customer.id,
        status: 'PENDING',
        total: product.price,
        items: {
          create: {
            productId: product.id,
            size: 'M',
            qty: 1,
            unitPrice: product.price,
            lineTotal: product.price,
          },
        },
        payments: {
          create: {
            idempotencyKey: item.key,
            amount: product.price,
            method: 'VNPAY',
            status: 'PENDING',
          },
        },
      },
    });

    console.log(`- Đã tạo đơn PENDING: ${item.productName} - ${product.price}đ`);
  }

  console.log('===== SEED HOÀN TẤT =====');
}

main()
  .catch((e) => {
    console.error('SEED THẤT BẠI:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
