
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu seed dữ liệu...');

  // 1. Xóa data cũ (theo thứ tự khóa ngoại)
  await prisma.orderItemTopping.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recipe.deleteMany(); 
  await prisma.ingredient.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.product.deleteMany();
<<<<<<< HEAD
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
=======
  await prisma.user.deleteMany();

  // 2. Tạo User 
  const passwordHash = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: { email: 'customer@brewlite.com', passwordHash, role: 'CUSTOMER', loyaltyPoints: 100 },
>>>>>>> 08be7defc4ecd4d9e3acbb7e329e03f9e94744b4
  });

<<<<<<< HEAD
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
=======
  // 3. Tạo NGUYÊN LIỆU (Đã tách chi tiết nguyên liệu chính và phụ)
  // Nhóm nguyên liệu chính (Cà phê, Trà, Sữa)
  const i_botCaPhe = await prisma.ingredient.create({ data: { name: 'Bột cà phê', stock: 5000, unit: 'gram' } });
  const i_traDen = await prisma.ingredient.create({ data: { name: 'Trà đen', stock: 3000, unit: 'gram' } });
  const i_traXanh = await prisma.ingredient.create({ data: { name: 'Trà xanh', stock: 2000, unit: 'gram' } });
  const i_suaDac = await prisma.ingredient.create({ data: { name: 'Sữa đặc', stock: 10000, unit: 'gram' } });
  const i_suaTuoi = await prisma.ingredient.create({ data: { name: 'Sữa tươi', stock: 15000, unit: 'ml' } });
  
  // Nhóm nguyên liệu phụ (Siro, Bột, Trái cây)
  const i_siroDao = await prisma.ingredient.create({ data: { name: 'Siro đào', stock: 5000, unit: 'ml' } });
  const i_siroVai = await prisma.ingredient.create({ data: { name: 'Siro vải', stock: 5000, unit: 'ml' } });
  const i_siroCaramel = await prisma.ingredient.create({ data: { name: 'Siro Caramel', stock: 5000, unit: 'ml' } });
  const i_botMatcha = await prisma.ingredient.create({ data: { name: 'Bột Matcha', stock: 2000, unit: 'gram' } });
  const i_botCookie = await prisma.ingredient.create({ data: { name: 'Bột Cookie', stock: 2000, unit: 'gram' } });
  const i_bo = await prisma.ingredient.create({ data: { name: 'Bơ', stock: 5000, unit: 'gram' } });
  const i_cam = await prisma.ingredient.create({ data: { name: 'Cam tươi', stock: 50, unit: 'quả' } });
  const i_chanh = await prisma.ingredient.create({ data: { name: 'Chanh tươi', stock: 50, unit: 'quả' } });
  const i_sa = await prisma.ingredient.create({ data: { name: 'Sả', stock: 2000, unit: 'gram' } });

  // Nhóm nguyên liệu cơ bản (Đường, Đá)
  const i_duong = await prisma.ingredient.create({ data: { name: 'Đường', stock: 20000, unit: 'gram' } });
  const i_da = await prisma.ingredient.create({ data: { name: 'Đá viên', stock: 50000, unit: 'gram' } });

  console.log('- Đã tạo nguyên liệu trong kho');

  // 4. Tạo 20 món nước (Sản phẩm)
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
>>>>>>> 08be7defc4ecd4d9e3acbb7e329e03f9e94744b4
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

<<<<<<< HEAD
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
=======
  // ==========================================
  // 6. CÔNG THỨC (RECIPE) - TÁCH BẠCH NGUYÊN LIỆU
  // ==========================================
  const recipes = [
    // --- Cà phê ---
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

    // --- Trà ---
    // Trà đào cam sả: Trà đen + Siro đào + Cam + Sả + Đá
    { name: 'Trà đào cam sả', items: [{ id: i_traDen.id, amt: 10 }, { id: i_siroDao.id, amt: 50 }, { id: i_cam.id, amt: 0.5 }, { id: i_sa.id, amt: 5 }, { id: i_da.id, amt: 150 }] },
    // Trà sữa: Trà đen + Sữa tươi + Đường + Đá
    { name: 'Trà sữa trân châu', items: [{ id: i_traDen.id, amt: 15 }, { id: i_suaTuoi.id, amt: 100 }, { id: i_duong.id, amt: 20 }, { id: i_da.id, amt: 100 }] },
    // Trà xanh matcha: Trà xanh + Bột matcha + Sữa + Đá
    { name: 'Trà xanh matcha', items: [{ id: i_traXanh.id, amt: 5 }, { id: i_botMatcha.id, amt: 15 }, { id: i_suaTuoi.id, amt: 100 }, { id: i_da.id, amt: 100 }] },
    // Trà vải: Trà đen + Siro vải + Đá
    { name: 'Trà vải', items: [{ id: i_traDen.id, amt: 10 }, { id: i_siroVai.id, amt: 50 }, { id: i_da.id, amt: 150 }] },
    // Trà chanh: Trà đen + Chanh + Đường + Đá
    { name: 'Trà chanh', items: [{ id: i_traDen.id, amt: 10 }, { id: i_chanh.id, amt: 1 }, { id: i_duong.id, amt: 20 }, { id: i_da.id, amt: 150 }] },

    // --- Đá xay & Sinh tố ---
    { name: 'Matcha đá xay', items: [{ id: i_botMatcha.id, amt: 20 }, { id: i_suaTuoi.id, amt: 100 }, { id: i_da.id, amt: 200 }] },
    { name: 'Cookie đá xay', items: [{ id: i_botCookie.id, amt: 30 }, { id: i_suaTuoi.id, amt: 100 }, { id: i_da.id, amt: 200 }] },
    { name: 'Sinh tố bơ', items: [{ id: i_bo.id, amt: 100 }, { id: i_suaDac.id, amt: 30 }, { id: i_da.id, amt: 100 }] },

    // --- Khác ---
    { name: 'Sữa tươi trân châu đường đen', items: [{ id: i_suaTuoi.id, amt: 200 }, { id: i_duong.id, amt: 30 }, { id: i_da.id, amt: 100 }] },
    { name: 'Nước ép cam', items: [{ id: i_cam.id, amt: 3 }, { id: i_duong.id, amt: 10 }, { id: i_da.id, amt: 100 }] }
  ];

  for (const r of recipes) {
    const productId = createdProducts[r.name];
    if (productId) {
      for (const item of r.items) {
        await prisma.recipe.create({
          data: {
            productId: productId,
            ingredientId: item.id,
            amount: item.amt,
          }
        });
      }
    }
  }
  console.log('- Đã nạp công thức chi tiết cho 20 món nước (bao gồm nguyên liệu chính + phụ)');
>>>>>>> 08be7defc4ecd4d9e3acbb7e329e03f9e94744b4

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
