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

  // 2. Tạo User 
  const passwordHash = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: { 
      email: 'customer@brewlite.com', 
      passwordHash, 
      role: 'CUSTOMER', 
      loyaltyPoints: 100 
    },
  });
  console.log('- Đã tạo User test: customer@brewlite.com / 123456');

  // 3. Tạo 20 món nước (Sản phẩm)
  const productsData = [
    // --- Cà phê Việt Nam ---
    { name: 'Cà phê đen đá', price: 25000, imageUrl: '/images/ca-phe-den.jpg', stock: 100 },
    { name: 'Cà phê sữa đá', price: 30000, imageUrl: '/images/ca-phe-sua.jpg', stock: 100 },
    { name: 'Bạc xỉu', price: 35000, imageUrl: '/images/bac-xiu.jpg', stock: 100 },
    { name: 'Cà phê muối', price: 35000, imageUrl: '/images/ca-phe-muoi.jpg', stock: 100 },
    
    // --- Cà phê Ý (Espresso/Milk-based) ---
    { name: 'Espresso', price: 30000, imageUrl: '/images/espresso.jpg', stock: 100 },
    { name: 'Americano', price: 35000, imageUrl: '/images/americano.jpg', stock: 100 },
    { name: 'Latte', price: 45000, imageUrl: '/images/latte.jpg', stock: 100 },
    { name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.jpg', stock: 100 },
    { name: 'Mocha', price: 50000, imageUrl: '/images/mocha.jpg', stock: 100 },
    { name: 'Caramel Macchiato', price: 55000, imageUrl: '/images/macchiato.jpg', stock: 100 },

    // --- Trà & Trà sữa ---
    { name: 'Trà đào cam sả', price: 45000, imageUrl: '/images/tra-dao.jpg', stock: 100 },
    { name: 'Trà sữa trân châu', price: 45000, imageUrl: '/images/tra-sua.jpg', stock: 100 },
    { name: 'Trà xanh matcha', price: 40000, imageUrl: '/images/matcha.jpg', stock: 100 },
    { name: 'Trà vải', price: 40000, imageUrl: '/images/tra-vai.jpg', stock: 100 },
    { name: 'Trà chanh', price: 25000, imageUrl: '/images/tra-chanh.jpg', stock: 100 },

    // --- Đá xay & Sinh tố ---
    { name: 'Matcha đá xay', price: 55000, imageUrl: '/images/matcha-da-xay.jpg', stock: 100 },
    { name: 'Cookie đá xay', price: 55000, imageUrl: '/images/cookie-da-xay.jpg', stock: 100 },
    { name: 'Sinh tố bơ', price: 45000, imageUrl: '/images/sinh-to-bo.jpg', stock: 100 },
    
    // --- Khác ---
    { name: 'Sữa tươi trân châu đường đen', price: 50000, imageUrl: '/images/sua-tuoi.jpg', stock: 100 },
    { name: 'Nước ép cam', price: 35000, imageUrl: '/images/nuoc-cam.jpg', stock: 100 },
  ];

  await prisma.product.createMany({ data: productsData });
  console.log(`- Đã tạo ${productsData.length} món nước`);

  // 4. Tạo Topping
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

  console.log('===== SEED HOÀN TẤT =====');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });