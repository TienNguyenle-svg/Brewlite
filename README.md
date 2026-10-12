# BrewLite

Ứng dụng đặt cà phê không dùng tiền mặt.

## Công nghệ
- Frontend:	Next.js (React, TypeScript), TailwindCSS, React Query/Zustand (giỏ hàng)
- Backend:	NestJS (TypeScript), REST, class-validator, JWT (Passport)
- CSDL:	PostgreSQL + Prisma 
- Thanh toán:	Mock Payment Service (mô phỏng Momo/VNPay/Stripe)
- DevOps:	Docker Compose, Git, README bàn giao
  
## Cài đặt
Xem hướng dẫn chi tiết tại [SETUP.md](./setup.md).
## Cách chạy

## Phân chia công việc

| Thành viên | Vai trò | Task chính | Task mở rộng | Hỗ trợ |
| :--- | :---: | ---: | ---: | ---: |
| Thủy Tiên | PO + BE Lead | Task 1, 2, 6 | API Admin (quản lý sản phẩm) | Database, quản lý Sprint, demo |
| Gia Hân | SM + BE | Task 7, 8 (BE), 10 | API Barista (cập nhật trạng thái đơn) | Database, Daily Scrum |
| Ngọc Hiển | FE Lead | Task 3, 4, 9 | Trang Admin (quản lý sản phẩm) | Review UI |
| Hoàng Quân | FE + Data | Task 5, 8 (FE) | Trang Barista (đơn đang chờ) | Seed data, Docker, README |

## Giải thích chi tiết từng người

### Thủy Tiên – PO + BE Lead
- Task 1: Khởi tạo dự án và cấu trúc
- Task 2: API danh sách sản phẩm (GET /products, GET /products/:id)
- Task 6: API tạo đơn hàng (POST /orders, GET /orders/me)
- Task mở rộng: API Admin (POST /admin/products, PATCH /admin/products/:id, DELETE /admin/products/:id)
- Hỗ trợ: Viết schema Prisma 5 bảng, migrate, seed data, quản lý Product Backlog, Sprint Planning, Review, Demo

### Gia Hân – SM + BE
- Task 7: Auth (register, login, JWT)
- Task 8 (BE): POST /payments (idempotent, mock gateway)
- Task 10: Order State Machine
- Task mở rộng: API Barista (GET /barista/orders, PATCH /barista/orders/:id)
- Hỗ trợ: Bảng Payment trong schema, tổ chức Daily Scrum, Sprint Retrospective

### Ngọc Hiển – FE Lead
- Task 3: Trang Menu (gọi GET /products)
- Task 4: Chi tiết sản phẩm (chọn size, topping)
- Task 9: Xác nhận đơn + lịch sử đơn
- Task mở rộng: Trang Admin (quản lý sản phẩm: thêm/sửa/xóa)
- Hỗ trợ: Review UI, hỗ trợ Hoàng Quân khi cần

### Hoàng Quân – FE + Data
- Task 5: Giỏ hàng (Zustand)
- Task 8 (FE): Trang thanh toán, chọn phương thức
- Task mở rộng: Trang Barista (xem đơn đang chờ, cập nhật trạng thái)
- Hỗ trợ: Seed data 4 sản phẩm, kiểm tra DB bằng Prisma Studio, Docker Compose, README, SETUP.md

## Bảng database

| Bảng | Người phụ trách |
| :--- | :--- |
| Product | Thủy Tiên |
| User | Thủy Tiên |
| Order | Thủy Tiên |
| OrderItem | Thủy Tiên |
| Payment | Gia Hân |
| Promotion (mở rộng) | Gia Hân |
| LoyaltyTransaction (mở rộng) | Gia Hân |

## Bảng thanh toán

| Phần | Người | Việc |
| :--- | :--- | :--- |
| Backend | Gia Hân | POST /payments, mock gateway, đổi Order status |
| Frontend | Hoàng Quân | Trang thanh toán, chọn phương thức, gọi API |
| State Machine | Gia Hân | PENDING → PAID → PREPARING → READY → COMPLETED |

## Bảng Sprint

| Sprint | Thủy Tiên | Gia Hân | Ngọc Hiển | Hoàng Quân |
| :--- | :--- | :--- | :--- | :--- |
| Sprint 1 | Task 1, 2 | Task 1, hỗ trợ 2 | Task 3 | Task 1, Docker |
| Sprint 2 | Task 6 | Task 7 | Task 4 | Task 5 |
| Sprint 3 | Hỗ trợ 8 | Task 8 (BE), 10 | Task 9 | Task 8 (FE) |
| Sprint 4 (mở rộng) | API Admin | API Barista | Trang Admin | Trang Barista |
| Cuối kỳ | Demo, Retro | Review, Retro | Demo | README, bàn giao |

## Danh sách task mở rộng (không chắc lắm )

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