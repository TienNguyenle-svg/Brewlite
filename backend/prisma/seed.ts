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
  await prisma.recipe.deleteMany(); // Xóa Recipe trước Ingredient
  await prisma.ingredient.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.product.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.user.deleteMany();

  // 2. Tạo User 
  const passwordHash = await bcrypt.hash('a123456', 10);
  const customer = await prisma.user.create({
    data: { email: 'customer@brewlite.com', passwordHash, role: 'CUSTOMER', loyaltyPoints: 100 },
  });
  await prisma.user.create({
    data: { email: 'admin@brewlite.com', passwordHash, role: 'ADMIN' },
  });
  await prisma.user.create({
    data: { email: 'barista@brewlite.com', passwordHash, role: 'BARISTA' },
  });
  console.log('- Đã tạo 3 tài khoản test (Mật khẩu: a123456)');

  // 3. Tạo nguyên liệu trong kho
  const i_botCaPhe = await prisma.ingredient.create({ data: { name: 'Bột cà phê', stock: 5000, unit: 'gram' } });
  const i_traDen = await prisma.ingredient.create({ data: { name: 'Trà đen', stock: 3000, unit: 'gram' } });
  const i_traXanh = await prisma.ingredient.create({ data: { name: 'Trà xanh', stock: 2000, unit: 'gram' } });
  const i_suaDac = await prisma.ingredient.create({ data: { name: 'Sữa đặc', stock: 10000, unit: 'gram' } });
  const i_suaTuoi = await prisma.ingredient.create({ data: { name: 'Sữa tươi', stock: 15000, unit: 'ml' } });
  const i_siroDao = await prisma.ingredient.create({ data: { name: 'Siro đào', stock: 5000, unit: 'ml' } });
  const i_siroVai = await prisma.ingredient.create({ data: { name: 'Siro vải', stock: 5000, unit: 'ml' } });
  const i_siroCaramel = await prisma.ingredient.create({ data: { name: 'Siro Caramel', stock: 5000, unit: 'ml' } });
  const i_botMatcha = await prisma.ingredient.create({ data: { name: 'Bột Matcha', stock: 2000, unit: 'gram' } });
  const i_botCookie = await prisma.ingredient.create({ data: { name: 'Bột Cookie', stock: 2000, unit: 'gram' } });
  const i_bo = await prisma.ingredient.create({ data: { name: 'Bơ', stock: 5000, unit: 'gram' } });
  const i_cam = await prisma.ingredient.create({ data: { name: 'Cam tươi', stock: 50, unit: 'quả' } });
  const i_chanh = await prisma.ingredient.create({ data: { name: 'Chanh tươi', stock: 50, unit: 'quả' } });
  const i_sa = await prisma.ingredient.create({ data: { name: 'Sả', stock: 2000, unit: 'gram' } });
  const i_duong = await prisma.ingredient.create({ data: { name: 'Đường', stock: 20000, unit: 'gram' } });
  const i_da = await prisma.ingredient.create({ data: { name: 'Đá viên', stock: 50000, unit: 'gram' } });
  console.log('- Đã tạo nguyên liệu trong kho');

  // 4. Tạo 20 món nước
  const productsData = [
    { name: 'Cà phê đen đá', price: 25000, imageUrl: '/images/ca-phe-den.jpg' },
    { name: 'Cà phê sữa đá', price: 30000, imageUrl: '/images/ca-phe-sua.jpg' },
    { name: 'Bạc xỉu', price: 35000, imageUrl: '/images/bac-xiu.jpg' },
    { name: 'Cà phê muối', price: 35000, imageUrl: '/images/ca-phe-muoi.jpg' },
    { name: 'Espresso', price: 30000, imageUrl: '/images/espresso.jpg' },
    { name: 'Americano', price: 35000, imageUrl: '/images/americano.jpg' },
    { name: 'Latte', price: 45000, imageUrl: '/images/latte.jpg' },
    { name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.jpg' },
    { name: 'Mocha', price: 50000, imageUrl: '/images/mocha.jpg' },
    { name: 'Caramel Macchiato', price: 55000, imageUrl: '/images/macchiato.jpg' },
    { name: 'Trà đào cam sả', price: 45000, imageUrl: '/images/tra-dao.jpg' },
    { name: 'Trà sữa trân châu', price: 45000, imageUrl: '/images/tra-sua.jpg' },
    { name: 'Trà xanh matcha', price: 40000, imageUrl: '/images/matcha.jpg' },
    { name: 'Trà vải', price: 40000, imageUrl: '/images/tra-vai.jpg' },
    { name: 'Trà chanh', price: 25000, imageUrl: '/images/tra-chanh.jpg' },
    { name: 'Matcha đá xay', price: 55000, imageUrl: '/images/matcha-da-xay.jpg' },
    { name: 'Cookie đá xay', price: 55000, imageUrl: '/images/cookie-da-xay.jpg' },
    { name: 'Sinh tố bơ', price: 45000, imageUrl: '/images/sinh-to-bo.jpg' },
    { name: 'Sữa tươi trân châu đường đen', price: 50000, imageUrl: '/images/sua-tuoi.jpg' },
    { name: 'Nước ép cam', price: 35000, imageUrl: '/images/nuoc-cam.jpg' },
  ];

  const createdProducts: Record<string, string> = {};
  for (const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    createdProducts[prod.name] = prod.id;
  }
  console.log(`- Đã tạo ${productsData.length} món nước`);

  // 5. Tạo Topping
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

  // 6. Công thức (BOM)
  const recipes = [
    { name: 'Cà phê đen đá', items: [{ id: i_botCaPhe.id, amt: 25 }, { id: i_duong.id, amt: 10 }, { id: i_da.id, amt: 100 }] },
    { name: 'Cà phê sữa đá', items: [{ id: i_botCaPhe.id, amt: 25 }, { id: i_suaDac.id, amt: 30 }, { id: i_da.id, amt: 100 }] },
    { name: 'Bạc xỉu', items: [{ id: i_botCaPhe.id, amt: 15 }, { id: i_suaTuoi.id, amt: 100 }, { id: i_suaDac.id, amt: 20 }, { id: i_da.id, amt: 100 }] },
    { name: 'Cà phê muối', items: [{ id: i_botCaPhe.id, amt: 25 }, { id: i_suaDac.id, amt: 30 }, { id: i_duong.id, amt: 5 }, { id: i_da.id, amt: 100 }] },
    { name: 'Espresso', items: [{ id: i_botCaPhe.id, amt: 30 }] },
    { name: 'Americano', items: [{ id: i_botCaPhe.id, amt: 30 }, { id: i_da.id, amt: 150 }] },
    { name: 'Latte', items: [{ id: i_botCaPhe.id, amt: 30 }, { id: i_suaTuoi.id, amt: 150 }, { id: i_da.id, amt: 80 }] },
    { name: 'Cappuccino', items: [{ id: i_botCaPhe.id, amt: 30 }, { id: i_suaTuoi.id, amt: 120 }, { id: i_da.id, amt: 80 }] },
    { name: 'Mocha', items: [{ id: i_botCaPhe.id, amt: 30 }, { id: i_suaTuoi.id, amt: 100 }, { id: i_duong.id, amt: 20 }, { id: i_da.id, amt: 80 }] },
    { name: 'Caramel Macchiato', items: [{ id: i_botCaPhe.id, amt: 30 }, { id: i_suaTuoi.id, amt: 150 }, { id: i_siroCaramel.id, amt: 30 }, { id: i_da.id, amt: 80 }] },
    { name: 'Trà đào cam sả', items: [{ id: i_traDen.id, amt: 10 }, { id: i_siroDao.id, amt: 50 }, { id: i_cam.id, amt: 0.5 }, { id: i_sa.id, amt: 5 }, { id: i_da.id, amt: 150 }] },
    { name: 'Trà sữa trân châu', items: [{ id: i_traDen.id, amt: 15 }, { id: i_suaTuoi.id, amt: 100 }, { id: i_duong.id, amt: 20 }, { id: i_da.id, amt: 100 }] },
    { name: 'Trà xanh matcha', items: [{ id: i_traXanh.id, amt: 5 }, { id: i_botMatcha.id, amt: 15 }, { id: i_suaTuoi.id, amt: 100 }, { id: i_da.id, amt: 100 }] },
    { name: 'Trà vải', items: [{ id: i_traDen.id, amt: 10 }, { id: i_siroVai.id, amt: 50 }, { id: i_da.id, amt: 150 }] },
    { name: 'Trà chanh', items: [{ id: i_traDen.id, amt: 10 }, { id: i_chanh.id, amt: 1 }, { id: i_duong.id, amt: 20 }, { id: i_da.id, amt: 150 }] },
    { name: 'Matcha đá xay', items: [{ id: i_botMatcha.id, amt: 20 }, { id: i_suaTuoi.id, amt: 100 }, { id: i_da.id, amt: 200 }] },
    { name: 'Cookie đá xay', items: [{ id: i_botCookie.id, amt: 30 }, { id: i_suaTuoi.id, amt: 100 }, { id: i_da.id, amt: 200 }] },
    { name: 'Sinh tố bơ', items: [{ id: i_bo.id, amt: 100 }, { id: i_suaDac.id, amt: 30 }, { id: i_da.id, amt: 100 }] },
    { name: 'Sữa tươi trân châu đường đen', items: [{ id: i_suaTuoi.id, amt: 200 }, { id: i_duong.id, amt: 30 }, { id: i_da.id, amt: 100 }] },
    { name: 'Nước ép cam', items: [{ id: i_cam.id, amt: 3 }, { id: i_duong.id, amt: 10 }, { id: i_da.id, amt: 100 }] }
  ];

  for (const r of recipes) {
    const productId = createdProducts[r.name];
    if (productId) {
      for (const item of r.items) {
        await prisma.recipe.create({
          data: { productId: productId, ingredientId: item.id, amount: item.amt }
        });
      }
    }
  }
  console.log('- Đã nạp công thức chi tiết cho 20 món nước');

  // ==========================================
  // 7. TẠO ĐƠN HÀNG MẪU VÀ KHUYẾN MÃI
  // ==========================================
  await prisma.promotion.create({
    data: { code: 'WELCOME10', discount: 10, type: 'PERCENT', minOrder: 50000, active: true },
  });

  const caPheSuaId = createdProducts['Cà phê sữa đá'];
  const traDaoId = createdProducts['Trà đào cam sả'];
  const bacXiuId = createdProducts['Bạc xỉu'];
  const matchaId = createdProducts['Trà xanh matcha'];

  // Đơn PENDING (Khách mới đặt, chưa thanh toán)
  await prisma.order.create({
    data: {
      userId: customer.id,
      status: 'PENDING',
      total: 30000,
      items: { create: { productId: caPheSuaId, size: 'M', qty: 1, unitPrice: 30000, lineTotal: 30000 } },
      payments: { create: { idempotencyKey: 'seed-payment-001', amount: 30000, method: 'VNPAY', status: 'PENDING' } },
    },
  });

  // Đơn PAID (Đã thanh toán, chờ Barista pha chế)
  await prisma.order.create({
    data: {
      userId: customer.id,
      status: 'PAID',
      total: 45000,
      items: { create: { productId: traDaoId, size: 'L', qty: 1, unitPrice: 45000, lineTotal: 45000 } },
    },
  });

  // Đơn PREPARING (Barista đang pha chế)
  await prisma.order.create({
    data: {
      userId: customer.id,
      status: 'PREPARING',
      total: 35000,
      items: { create: { productId: bacXiuId, size: 'M', qty: 1, unitPrice: 35000, lineTotal: 35000 } },
    },
  });

  // Đơn READY (Barista đã pha xong, chờ khách nhận)
  await prisma.order.create({
    data: {
      userId: customer.id,
      status: 'READY',
      total: 40000,
      items: { create: { productId: matchaId, size: 'S', qty: 1, unitPrice: 40000, lineTotal: 40000 } },
    },
  });

  console.log('- Đã tạo mã WELCOME10 và 4 đơn hàng mẫu (PENDING, PAID, PREPARING, READY)');
  console.log('===== SEED HOÀN TẤT =====');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });