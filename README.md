# BrewLite

Ứng dụng đặt cà phê không dùng tiền mặt.

## Công nghệ

- Frontend: Next.js (React, TypeScript), TailwindCSS, React Query/Zustand (giỏ hàng)
- Backend: NestJS (TypeScript), REST, class-validator, JWT (Passport), Swagger UI
- CSDL: PostgreSQL + Prisma
- Thanh toán: Mock Payment Service (mô phỏng Momo/VNPay/Stripe)
- DevOps: Docker Compose, Git, README bàn giao

## Cài đặt

Xem hướng dẫn chi tiết tại [SETUP.md](./setup.md).

## Cấu trúc dự án

Brewlite/
├── backend/                    # NestJS Backend
│   ├── prisma/                 # Database
│   │   ├── schema.prisma       # Định nghĩa các bảng
│   │   ├── seed.ts             # Dữ liệu mẫu
│   │   └── migrations/         # Lịch sử migrate
│   ├── src/                    # Source code
│   │   ├── prisma/             # Module Prisma
│   │   ├── products/           # Module sản phẩm
│   │   ├── auth/               # Module đăng nhập
│   │   ├── orders/             # Module đơn hàng
│   │   ├── payments/           # Module thanh toán
│   │   ├── app.module.ts       # Module gốc
│   │   └── main.ts             # Khởi động app
│   ├── test/                   # Test tự động
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/                   # Next.js Frontend
│   ├── app/                    # App Router
│   │   ├── page.tsx            # Trang Menu
│   │   ├── products/[id]/      # Chi tiết sản phẩm
│   │   ├── cart/               # Giỏ hàng
│   │   ├── checkout/           # Thanh toán
│   │   ├── orders/             # Lịch sử đơn
│   │   ├── login/              # Đăng nhập
│   │   ├── layout.tsx          # Layout chung
│   │   └── globals.css         # CSS toàn cục
│   ├── components/             # Component tái sử dụng
│   ├── lib/                    # Hàm gọi API
│   ├── store/                  # Zustand store
│   ├── public/                 # Ảnh, icon
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
│
├── report/                     # File đề bài
│   └── BrewLite-CongNghePhanMem.pdf
│
├── docker-compose.yml          # Chạy toàn bộ hệ thống
├── .env.example                # Biến môi trường mẫu
├── .gitignore
├── README.md
└── setup.md                    # Hướng dẫn cài đặt

### Nguyên tắc tổ chức

Backend:
- Tổ chức theo chức năng (feature-based), không theo loại file.
- Mỗi chức năng = 1 thư mục trong src/.
- Trong mỗi thư mục: controller, service, module, dto/.

Frontend:
- Tổ chức theo route (App Router của Next.js).
- Mỗi màn hình = 1 thư mục trong app/.
- Component tái sử dụng đặt trong components/.

Database:
- Schema Prisma đặt trong backend/prisma/.
- Seed data trong backend/prisma/seed.ts.
- Migration tự sinh trong backend/prisma/migrations/.

Lợi ích:
- Dễ tìm code theo chức năng.
- Dễ chia việc cho nhiều người.
- Dễ mở rộng (thêm chức năng mới chỉ cần tạo thư mục mới).

## API Endpoints

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| GET | /products | Danh sách sản phẩm | Không |
| GET | /products/:id | Chi tiết sản phẩm | Không |
| POST | /auth/register | Đăng ký tài khoản | Không |
| POST | /auth/login | Đăng nhập, trả JWT | Không |
| POST | /orders | Tạo đơn hàng (PENDING) | Có |
| GET | /orders/me | Lịch sử đơn của user | Có |
| POST | /payments | Thanh toán (idempotent) | Có |

Swagger UI: http://localhost:3001/api

## Thực thể chính

- Product: id, name, price, imageUrl, stock
- Topping: id, name, price
- User: id, email, passwordHash, loyaltyPoints, role
- Order: id, userId, status, total, createdAt, promotionId
- OrderItem: id, orderId, productId, size, qty, unitPrice, lineTotal
- OrderItemTopping: id, orderItemId, toppingId, price
- Payment: id, orderId, idempotencyKey, amount, method, status
- Promotion: id, code, discount, type, minOrder, expiredAt, active
- LoyaltyTransaction: id, userId, points, reason, orderId

## Order State Machine

PENDING → PAID → PREPARING → READY → COMPLETED
   ↓
PAYMENT_FAILED (có thể thử lại)
   ↓
CANCELLED

## Tài khoản test

| Vai trò | Email | Password |
|---------|-------|----------|
| Customer | customer@brewlite.com | 123456 |
| Barista | barista@brewlite.com | 123456 |
| Admin | admin@brewlite.com | 123456 |

## Phân chia công việc

| Thành viên | Vai trò | Task chính | Task mở rộng | Hỗ trợ |
| :--- | :---: | ---: | ---: | ---: |
| Thủy Tiên | PO + BE Lead | Task 1, 2, 6 | API Admin (quản lý sản phẩm) | Database, quản lý Sprint, demo |
| Gia Hân | SM + BE | Task 7, 8 (BE), 10 | API Barista (cập nhật trạng thái đơn) | Database, Daily Scrum |
| Ngọc Hiển | FE Lead | Task 3, 4, 9 | Trang Admin (quản lý sản phẩm) | Review UI |
| Hoàng Quân | FE + Data | Task 5, 8 (FE) | Trang Barista (đơn đang chờ) | Seed data, Docker, README |

## Bảng database

| Bảng | Người phụ trách |
| :--- | :--- |
| Product | Thủy Tiên |
| User | Thủy Tiên |
| Order | Thủy Tiên |
| OrderItem | Thủy Tiên |
| Payment | Gia Hân |
| Topping | Thủy Tiên |
| OrderItemTopping | Thủy Tiên |
| Promotion (mở rộng) | Gia Hân |
| LoyaltyTransaction (mở rộng) | Gia Hân |

## Bảng Sprint

| Sprint | Thủy Tiên | Gia Hân | Ngọc Hiển | Hoàng Quân |
| :--- | :--- | :--- | :--- | :--- |
| Sprint 1 | Task 1, 2 | Task 1, hỗ trợ 2 | Task 3 | Task 1, Docker |
| Sprint 2 | Task 6 | Task 7 | Task 4 | Task 5 |
| Sprint 3 | Hỗ trợ 8 | Task 8 (BE), 10 | Task 9 | Task 8 (FE) |
| Sprint 4 (mở rộng) | API Admin | API Barista | Trang Admin | Trang Barista |
| Cuối kỳ | Demo, Retro | Review, Retro | Demo | README, bàn giao |

## Danh sách task mở rộng

| Task mở rộng | Người | Mô tả |
| :--- | :--- | :--- |
| API Admin | Thủy Tiên | POST /admin/products, PATCH /admin/products/:id, DELETE /admin/products/:id |
| API Barista | Gia Hân | GET /barista/orders, PATCH /barista/orders/:id |
| Trang Admin | Ngọc Hiển | Giao diện quản lý sản phẩm (thêm/sửa/xóa) |
| Trang Barista | Hoàng Quân | Giao diện xem đơn đang chờ, cập nhật trạng thái |
| Khuyến mãi | Gia Hân | POST /promotions/apply, bảng Promotion |
| Điểm thưởng | Gia Hân | GET /users/me/loyalty, POST /users/me/redeem |
| Thông báo | Hoàng Quân | Gửi email xác nhận đơn (mock) |
| Đánh giá | Ngọc Hiển | POST /reviews, GET /products/:id/reviews |
| Báo cáo doanh thu | Thủy Tiên | GET /admin/reports/revenue |



