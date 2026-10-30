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
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();
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

  // 3. Tạo nguyên liệu tồn kho
  const ingredientData: { name: string; stock: number; unit: string }[] = [
    { name: 'Bột cà phê', stock: 5000, unit: 'gram' },
    { name: 'Trà đen', stock: 3000, unit: 'gram' },
    { name: 'Trà xanh', stock: 2000, unit: 'gram' },
    { name: 'Sữa đặc', stock: 10000, unit: 'gram' },
    { name: 'Sữa tươi', stock: 15000, unit: 'ml' },
    { name: 'Siro đào', stock: 5000, unit: 'ml' },
    { name: 'Siro vải', stock: 5000, unit: 'ml' },
    { name: 'Siro Caramel', stock: 5000, unit: 'ml' },
    { name: 'Bột Matcha', stock: 2000, unit: 'gram' },
    { name: 'Bột Cookie', stock: 2000, unit: 'gram' },
    { name: 'Bơ', stock: 5000, unit: 'gram' },
    { name: 'Cam tươi', stock: 50, unit: 'quả' },
    { name: 'Chanh tươi', stock: 50, unit: 'quả' },
    { name: 'Sả', stock: 2000, unit: 'gram' },
    { name: 'Đường', stock: 20000, unit: 'gram' },
    { name: 'Đá viên', stock: 50000, unit: 'gram' },
  ];
  const ingredientIds = new Map<string, string>();
  for (const ingredient of ingredientData) {
    const created = await prisma.ingredient.create({ data: ingredient });
    ingredientIds.set(ingredient.name, created.id);
  }
  console.log('- Đã tạo nguyên liệu trong kho');

  // 4. Tạo 20 món nước
  const productsData = [
    // Cà phê Việt Nam
    {
      name: 'Cà phê đen đá',
      price: 25000,
      imageUrl: '/images/ca-phe-den.jpg',
      stock: 100,
    },
    {
      name: 'Cà phê sữa đá',
      price: 30000,
      imageUrl: '/images/ca-phe-sua.jpg',
      stock: 100,
    },
    {
      name: 'Bạc xỉu',
      price: 35000,
      imageUrl: '/images/bac-xiu.jpg',
      stock: 100,
    },
    {
      name: 'Cà phê muối',
      price: 35000,
      imageUrl: '/images/ca-phe-muoi.jpg',
      stock: 100,
    },

    // Cà phê Ý
    {
      name: 'Espresso',
      price: 30000,
      imageUrl: '/images/espresso.jpg',
      stock: 100,
    },
    {
      name: 'Americano',
      price: 35000,
      imageUrl: '/images/americano.jpg',
      stock: 100,
    },
    { name: 'Latte', price: 45000, imageUrl: '/images/latte.jpg', stock: 100 },
    {
      name: 'Cappuccino',
      price: 45000,
      imageUrl: '/images/cappuccino.jpg',
      stock: 100,
    },
    { name: 'Mocha', price: 50000, imageUrl: '/images/mocha.jpg', stock: 100 },
    {
      name: 'Caramel Macchiato',
      price: 55000,
      imageUrl: '/images/macchiato.jpg',
      stock: 100,
    },

    // Trà và trà sữa
    {
      name: 'Trà đào cam sả',
      price: 45000,
      imageUrl: '/images/tra-dao.jpg',
      stock: 100,
    },
    {
      name: 'Trà sữa trân châu',
      price: 45000,
      imageUrl: '/images/tra-sua.jpg',
      stock: 100,
    },
    {
      name: 'Trà xanh matcha',
      price: 40000,
      imageUrl: '/images/matcha.jpg',
      stock: 100,
    },
    {
      name: 'Trà vải',
      price: 40000,
      imageUrl: '/images/tra-vai.jpg',
      stock: 100,
    },
    {
      name: 'Trà chanh',
      price: 25000,
      imageUrl: '/images/tra-chanh.jpg',
      stock: 100,
    },

    // Đá xay và sinh tố
    {
      name: 'Matcha đá xay',
      price: 55000,
      imageUrl: '/images/matcha-da-xay.jpg',
      stock: 100,
    },
    {
      name: 'Cookie đá xay',
      price: 55000,
      imageUrl: '/images/cookie-da-xay.jpg',
      stock: 100,
    },
    {
      name: 'Sinh tố bơ',
      price: 45000,
      imageUrl: '/images/sinh-to-bo.jpg',
      stock: 100,
    },

    // Khác
    {
      name: 'Sữa tươi trân châu đường đen',
      price: 50000,
      imageUrl: '/images/sua-tuoi.jpg',
      stock: 100,
    },
    {
      name: 'Nước ép cam',
      price: 35000,
      imageUrl: '/images/nuoc-cam.jpg',
      stock: 100,
    },
  ];

  await prisma.product.createMany({ data: productsData });

  const products = await prisma.product.findMany();
  const productIds = new Map(
    products.map((product) => [product.name, product.id]),
  );
  const findProduct = (name: string) => {
    const product = products.find((p) => p.name === name);
    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm: ${name}`);
    }
    return product;
  };

  console.log(`- Đã tạo ${productsData.length} món nước`);

  // 5. Tạo 7 loại topping
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
  console.log('- Đã tạo mã khuyến mãi WELCOME10');

  // 6. Tạo công thức nguyên liệu
  const recipes: {
    productName: string;
    ingredients: { name: string; amount: number }[];
  }[] = [
    {
      productName: 'Cà phê đen đá',
      ingredients: [
        { name: 'Bột cà phê', amount: 25 },
        { name: 'Đường', amount: 10 },
        { name: 'Đá viên', amount: 100 },
      ],
    },
    {
      productName: 'Cà phê sữa đá',
      ingredients: [
        { name: 'Bột cà phê', amount: 25 },
        { name: 'Sữa đặc', amount: 30 },
        { name: 'Đá viên', amount: 100 },
      ],
    },
    {
      productName: 'Bạc xỉu',
      ingredients: [
        { name: 'Bột cà phê', amount: 15 },
        { name: 'Sữa tươi', amount: 100 },
        { name: 'Sữa đặc', amount: 20 },
        { name: 'Đá viên', amount: 100 },
      ],
    },
    {
      productName: 'Cà phê muối',
      ingredients: [
        { name: 'Bột cà phê', amount: 25 },
        { name: 'Sữa đặc', amount: 30 },
        { name: 'Đường', amount: 5 },
        { name: 'Đá viên', amount: 100 },
      ],
    },
    {
      productName: 'Espresso',
      ingredients: [{ name: 'Bột cà phê', amount: 30 }],
    },
    {
      productName: 'Americano',
      ingredients: [
        { name: 'Bột cà phê', amount: 30 },
        { name: 'Đá viên', amount: 150 },
      ],
    },
    {
      productName: 'Latte',
      ingredients: [
        { name: 'Bột cà phê', amount: 30 },
        { name: 'Sữa tươi', amount: 150 },
        { name: 'Đá viên', amount: 80 },
      ],
    },
    {
      productName: 'Cappuccino',
      ingredients: [
        { name: 'Bột cà phê', amount: 30 },
        { name: 'Sữa tươi', amount: 120 },
        { name: 'Đá viên', amount: 80 },
      ],
    },
    {
      productName: 'Mocha',
      ingredients: [
        { name: 'Bột cà phê', amount: 30 },
        { name: 'Sữa tươi', amount: 100 },
        { name: 'Đường', amount: 20 },
        { name: 'Đá viên', amount: 80 },
      ],
    },
    {
      productName: 'Caramel Macchiato',
      ingredients: [
        { name: 'Bột cà phê', amount: 30 },
        { name: 'Sữa tươi', amount: 150 },
        { name: 'Siro Caramel', amount: 30 },
        { name: 'Đá viên', amount: 80 },
      ],
    },
    {
      productName: 'Trà đào cam sả',
      ingredients: [
        { name: 'Trà đen', amount: 10 },
        { name: 'Siro đào', amount: 50 },
        { name: 'Cam tươi', amount: 0.5 },
        { name: 'Sả', amount: 5 },
        { name: 'Đá viên', amount: 150 },
      ],
    },
    {
      productName: 'Trà sữa trân châu',
      ingredients: [
        { name: 'Trà đen', amount: 15 },
        { name: 'Sữa tươi', amount: 100 },
        { name: 'Đường', amount: 20 },
        { name: 'Đá viên', amount: 100 },
      ],
    },
    {
      productName: 'Trà xanh matcha',
      ingredients: [
        { name: 'Trà xanh', amount: 5 },
        { name: 'Bột Matcha', amount: 15 },
        { name: 'Sữa tươi', amount: 100 },
        { name: 'Đá viên', amount: 100 },
      ],
    },
    {
      productName: 'Trà vải',
      ingredients: [
        { name: 'Trà đen', amount: 10 },
        { name: 'Siro vải', amount: 50 },
        { name: 'Đá viên', amount: 150 },
      ],
    },
    {
      productName: 'Trà chanh',
      ingredients: [
        { name: 'Trà đen', amount: 10 },
        { name: 'Chanh tươi', amount: 1 },
        { name: 'Đường', amount: 20 },
        { name: 'Đá viên', amount: 150 },
      ],
    },
    {
      productName: 'Matcha đá xay',
      ingredients: [
        { name: 'Bột Matcha', amount: 20 },
        { name: 'Sữa tươi', amount: 100 },
        { name: 'Đá viên', amount: 200 },
      ],
    },
    {
      productName: 'Cookie đá xay',
      ingredients: [
        { name: 'Bột Cookie', amount: 30 },
        { name: 'Sữa tươi', amount: 100 },
        { name: 'Đá viên', amount: 200 },
      ],
    },
    {
      productName: 'Sinh tố bơ',
      ingredients: [
        { name: 'Bơ', amount: 100 },
        { name: 'Sữa đặc', amount: 30 },
        { name: 'Đá viên', amount: 100 },
      ],
    },
    {
      productName: 'Sữa tươi trân châu đường đen',
      ingredients: [
        { name: 'Sữa tươi', amount: 200 },
        { name: 'Đường', amount: 30 },
        { name: 'Đá viên', amount: 100 },
      ],
    },
    {
      productName: 'Nước ép cam',
      ingredients: [
        { name: 'Cam tươi', amount: 3 },
        { name: 'Đường', amount: 10 },
        { name: 'Đá viên', amount: 100 },
      ],
    },
  ];

  for (const recipe of recipes) {
    const productId = productIds.get(recipe.productName);
    if (!productId) {
      throw new Error(`Không tìm thấy sản phẩm: ${recipe.productName}`);
    }

    for (const item of recipe.ingredients) {
      const ingredientId = ingredientIds.get(item.name);
      if (!ingredientId) {
        throw new Error(`Không tìm thấy nguyên liệu: ${item.name}`);
      }

      await prisma.recipe.create({
        data: { productId, ingredientId, amount: item.amount },
      });
    }
  }
  console.log('- Đã nạp công thức cho 20 món nước');

  // 7. Tạo 3 đơn hàng PENDING và 3 payment PENDING
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

    console.log(
      `- Đã tạo đơn PENDING: ${item.productName} - ${product.price}đ`,
    );
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
