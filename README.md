# Ứng dụng đặt cà phê không dùng tiền mặt (BrewLite)

## Công nghệ
- **Frontend:** Next.js (React, TypeScript), TailwindCSS, React Query/Zustand (giỏ hàng)
- **Backend:** NestJS (TypeScript), REST, class-validator, JWT (Passport)
- **CSDL:** PostgreSQL + Prisma 
- **Thanh toán:** Tích hợp VNPay (có URL và callback return)
- **DevOps:** Docker Compose, Git

## Cài đặt
Xem hướng dẫn chi tiết tại [SETUP.md](./setup.md).

## Cấu trúc dự án
```
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
│   │   ├── admin/              # Module quản trị
│   │   ├── barista/            # Module pha chế
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
│   │   ├── admin/              # Khu vực quản trị
│   │   ├── barista/            # Khu vực pha chế
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
│   └── Assignment2-BrewLite.pdf
│   └── BrewLite-CongNghePhanMem.pdf
│
├── docker-compose.yml          # Chạy toàn bộ hệ thống
├── .env.example                # Biến môi trường mẫu
├── .gitignore
├── README.md
└── setup.md                    # Hướng dẫn cài đặt

```
### Nguyên tắc tổ chức
- **Backend:** Tổ chức theo chức năng (feature-based), không theo loại file. Mỗi chức năng = 1 thư mục trong `src/`. Trong mỗi thư mục: controller, service, module, dto/.
- **Frontend:** Tổ chức theo route (App Router của Next.js). Mỗi màn hình = 1 thư mục trong `app/`. Component tái sử dụng đặt trong `components/`.
- **Database:** Schema Prisma đặt trong `backend/prisma/`. Seed data trong `backend/prisma/seed.ts`. Migration tự sinh trong `backend/prisma/migrations/`.

## API Endpoints

| Method | Endpoint | Chức năng | Auth |
|--------|----------|-----------|------|
| GET | `/` | Kiểm tra trạng thái App | Không |
| POST | `/auth/register` | Đăng ký tài khoản | Không |
| POST | `/auth/login` | Đăng nhập và nhận JWT | Không |
| POST | `/auth/logout` | Đăng xuất và vô hiệu hóa JWT | Có |
| GET | `/products` | Lấy danh sách sản phẩm (Mặc định: Bán chạy) | Không |
| GET | `/products/{id}` | Lấy chi tiết sản phẩm theo ID | Không |
| POST | `/checkout/preview` | Xem trước tổng tiền theo giỏ hàng, voucher, điểm và phí ship | Có |
| POST | `/orders` | Tạo đơn hàng mới (PENDING) | Có |
| GET | `/orders/me` | Xem lịch sử đơn hàng | Có |
| PATCH | `/orders/{id}/cancel` | Khách hủy đơn (Chỉ khi PAID) và hoàn tiền, hoàn kho | Có |
| POST | `/payments` | Tạo URL thanh toán VNPay, chỉ dành cho CUSTOMER | Có |
| POST | `/payments/orders/{orderId}/cancel` | Khách hủy đơn (sau khi thanh toán lỗi hoặc khi chưa có lượt thanh toán còn hạn) | Có |
| GET | `/payments/vnpay-return` | Xác minh kết quả thanh toán trả về từ VNPay | Không |
| GET | `/users/me/loyalty` | Xem số điểm thưởng và lịch sử điểm | Có |
| GET | `/barista/orders` | Lấy danh sách đơn hàng Barista | Có |
| PATCH | `/barista/orders/{id}` | Cập nhật trạng thái đơn hàng pha chế | Có |
| POST | `/admin/products` | Thêm sản phẩm mới (kèm công thức) | Có |
| PATCH | `/admin/products/{id}` | Cập nhật sản phẩm | Có |
| DELETE | `/admin/products/{id}` | Xóa sản phẩm | Có |
| GET | `/admin/inventory` | Xem toàn bộ tồn kho (Nguyên liệu và Topping) | Có |
| POST | `/admin/ingredients` | Thêm nguyên liệu mới vào kho | Có |
| POST | `/admin/ingredients/{id}/import`| Nhập thêm nguyên liệu đã có vào kho | Có |
| POST | `/admin/toppings` | Thêm topping mới vào kho | Có |
| POST | `/admin/toppings/{id}/import` | Nhập thêm topping đã có vào kho | Có |
| GET | `/admin/reports/revenue` | Xem báo cáo doanh thu | Có |
| GET | `/admin/orders` | Xem danh sách tất cả đơn hàng | Có |

## Thực thể chính
- **Product:** id, name, price, imageUrl, stock (tính toán dựa trên công thức)
- **Ingredient & Topping:** id, name, stock, unit (Quản lý tồn kho)
- **User:** id, email, passwordHash, loyaltyPoints, role
- **Order:** id, userId, status, total, createdAt, promotionId
- **OrderItem:** id, orderId, productId, size, qty, unitPrice, lineTotal
- **Payment:** id, orderId, amount, method, status, transactionId
- **Promotion:** id, code, discount, type, minOrder, expiredAt, active
- **LoyaltyTransaction:** id, userId, points, reason, orderId

## Order State Machine
```
PENDING → PAID → PREPARING → READY → COMPLETED
   ↓
PAYMENT_FAILED (Có thể thử lại hoặc hủy qua `/payments/orders/{orderId}/cancel`)
   ↓
CANCELLED (Hủy bởi khách qua `/orders/{id}/cancel` hoặc hệ thống tự hủy)
```
## Chức năng chính

### Khách hàng
| Chức năng | Mô tả | API | BE | FE |
| :--- | :--- | :--- | :--- | :--- |
| Xem menu | Danh sách đồ uống kèm hình, tên, giá | GET `/products` | Thủy Tiên | Ngọc Hiển |
| Xem chi tiết | Chọn size (S/M/L), topping | GET `/products/{id}` | Thủy Tiên | Ngọc Hiển |
| Giỏ hàng | Thêm/sửa/xóa, tính tổng tiền | (Zustand) | (Không cần API) | Hoàng Quân |
| Checkout Preview | Xem trước tổng tiền, áp mã, điểm | POST `/checkout/preview` | Gia Hân | Hoàng Quân |
| Đăng ký | Tạo tài khoản mới | POST `/auth/register` | Gia Hân | Ngọc Hiển |
| Đăng nhập | Nhận JWT token | POST `/auth/login` | Gia Hân | Ngọc Hiển |
| Tạo đơn hàng | Đặt đơn, trạng thái PENDING | POST `/orders` | Thủy Tiên | Hoàng Quân |
| Thanh toán | Chọn Ví/Thẻ, chuyển hướng VNPay | POST `/payments` | Gia Hân | Hoàng Quân |
| Hủy đơn | Hủy đơn khi lỗi thanh toán hoặc PAID | PATCH `/orders/{id}/cancel` | Gia Hân | Ngọc Hiển |
| Lịch sử đơn | Xem các đơn đã đặt | GET `/orders/me` | Thủy Tiên | Ngọc Hiển |
| Điểm thưởng | Xem điểm và lịch sử điểm | GET `/users/me/loyalty` | Gia Hân | Ngọc Hiển |

### Barista (mở rộng)
| Chức năng | Mô tả | API | BE | FE |
|-----------|-------|-----|---|---|
| Xem đơn chờ | Danh sách đơn đang chờ pha chế | GET `/barista/orders` | Gia Hân | Hoàng Quân |
| Cập nhật trạng thái | PAID → PREPARING → READY → COMPLETED | PATCH `/barista/orders/{id}` | Gia Hân | Hoàng Quân |

### Admin (mở rộng)
| Chức năng | Mô tả | API | BE | FE |
|-----------|-------|-----|---|---|
| Quản lý sản phẩm | Thêm/sửa/xóa sản phẩm | POST/PATCH/DELETE `/admin/products` | Thủy Tiên | Ngọc Hiển |
| Quản lý kho | Nhập nguyên liệu, topping, xem tồn kho | GET, POST `/admin/inventory...` | Thủy Tiên | Ngọc Hiển |
| Quản lý đơn hàng | Xem toàn bộ đơn hàng | GET `/admin/orders` | Thủy Tiên | Ngọc Hiển |
| Báo cáo doanh thu | Xem doanh thu theo ngày/tháng | GET `/admin/reports/revenue` | Thủy Tiên | Ngọc Hiển |

## Phân chia công việc

| Thành viên | Vai trò | Task chính | Hỗ trợ |
| :--- | :---: | :--- | :--- |
| **Thủy Tiên** | PO + BE | **Khởi tạo cấu trúc dự án, viết README, SETUP.md**. Thiết kế **Database & Schema**. Viết API Sản phẩm, Đơn hàng khách, API Admin (Kho, Sản phẩm, Báo cáo, Đơn hàng). | Hỗ trợ Gia Hân, quản lý Sprint, Demo. |
| **Gia Hân** | SM + BE | Thiết kế **Database & Schema**. Viết API Auth, API Thanh toán (VNPay), API Checkout Preview, API Barista, Order State Machine, API Điểm thưởng. | Hỗ trợ Tiên phần CSDL, tổ chức Scrum/Retro. |
| **Ngọc Hiển** | FE | Giao diện: Trang Menu, Chi tiết sản phẩm, Auth, Lịch sử đơn/Hủy đơn, Trang Admin (Quản lý kho, Sản phẩm, Báo cáo). | Review UI, hỗ trợ Hoàng Quân. |
| **Hoàng Quân** | FE | Giao diện: Giỏ hàng (Zustand), Checkout (xem trước tổng tiền, chọn thanh toán), Trang Barista (xem/cập nhật đơn). | Hỗ trợ Ngọc Hiển và review |

## Giải thích chi tiết từng người

### Thủy Tiên – PO + BE
- **Khởi tạo:** Thiết lập cấu trúc dự án, cấu hình Docker, viết tài liệu `README.md` và `setup.md`.
- **Database:** Chịu trách nhiệm chính thiết kế Schema Prisma cho các bảng (cùng Gia Hân).
- **Task Backend:** API danh sách/chi tiết sản phẩm, tạo và xem đơn hàng của khách hàng. Xây dựng toàn bộ luồng API Admin (Quản lý tồn kho chi tiết nguyên liệu, topping, quản lý sản phẩm, báo cáo doanh thu và xem toàn bộ đơn hàng).
- **Khác:** Quản lý Product Backlog, Sprint Planning, Review, Demo.

### Gia Hân – SM + BE
- **Database:** Chịu trách nhiệm chính thiết kế Schema Prisma (đặc biệt bảng Payment, Promotion, Loyalty) cùng Thủy Tiên.
- **Task Backend:** Xử lý luồng xác thực (Register, Login, Logout, JWT). Tích hợp thanh toán VNPay (tạo URL, xử lý callback). API xem trước tổng tiền (Checkout preview), luồng điểm thưởng. Xây dựng API cho Barista và quản lý chuyển đổi trạng thái đơn hàng (Order State Machine).
- **Khác:** Tổ chức Daily Scrum, Sprint Retrospective.

### Ngọc Hiển – FE 
- **Task Frontend Khách hàng:** Xây dựng màn hình danh sách đồ uống, chi tiết sản phẩm, luồng đăng nhập/đăng ký, xem lịch sử đơn hàng và chức năng khách tự hủy đơn.
- **Task Frontend Admin:** Xây dựng dashboard quản lý kho nguyên liệu/topping (thêm mới, import), quản lý sản phẩm dựa trên công thức, xem báo cáo doanh thu và quản lý toàn bộ đơn hàng.
- **Khác:** Review UI, hỗ trợ Hoàng Quân.
- 
### Hoàng Quân – FE
- **Task Frontend Khách hàng:** Quản lý state giỏ hàng (Zustand), xây dựng màn hình thanh toán tổng hợp (áp dụng voucher, điểm thưởng từ API preview) và chuyển hướng thanh toán VNPay.
- **Task Frontend Barista:** Xây dựng màn hình xem danh sách đơn đang chờ và nút cập nhật trạng thái pha chế.
- **Khác:** Hỗ trợ Ngọc Hiển và review

## Bảng database (Chịu trách nhiệm chính: Tiên & Hân)

| Bảng | Trách nhiệm thiết kế chính |
| :--- | :--- | 
| Product | Thủy Tiên |
| Ingredient / Topping | Thủy Tiên | 
| User | Thủy Tiên |
| Order / OrderItem | Thủy Tiên |
| Payment | Gia Hân | 
| Promotion | Gia Hân |
| LoyaltyTransaction | Gia Hân |

## Bảng thanh toán

| Phần | Người phụ trách | Công việc |
| :--- | :--- | :--- |
| Backend | Gia Hân | POST `/payments`, xử lý callback VNPay, tính tổng tiền Checkout Preview, API Hủy đơn hoàn tiền. |
| Frontend | Hoàng Quân | Trang thanh toán, xem trước hóa đơn, chọn phương thức, chuyển hướng VNPay. |
| State Machine | Gia Hân | Cập nhật PENDING → PAID hoặc PENDING → PAYMENT_FAILED → CANCELLED. |

## Bảng Sprint

| Sprint | Thủy Tiên (BE) | Gia Hân (BE) | Ngọc Hiển (FE) | Hoàng Quân (FE) |
| :--- | :--- | :--- | :--- | :--- |
| **Sprint 1** | Khởi tạo dự án, cấu hình Docker, README, Schema DB, API Sản phẩm. | Schema DB (cùng Tiên), API Auth (Login/Register). | Trang Menu, Chi tiết sản phẩm, Đăng nhập/Đăng ký. | Giỏ hàng (Zustand), Seed data (Hỗ trợ DB). |
| **Sprint 2** | API Đơn hàng (Tạo, Xem lịch sử). | API Thanh toán (VNPay), Checkout Preview, Hủy đơn. | Xác nhận đơn, Lịch sử đơn. | Trang Checkout, chuyển hướng VNPay. |
| **Sprint 3** | API Admin (Sản phẩm, Kho, Doanh thu). | API Barista, Order State Machine, API Loyalty. | Trang Admin (Quản lý kho, Sản phẩm, Báo cáo). | Trang Barista. |
| **Cuối kỳ** | Demo, Sprint Review | Sprint Retrospective, hoàn thiện luồng State Machine. | Hoàn thiện UI/UX. | Chạy thử toàn hệ thống nghiệm thu. |

## Danh sách task mở rộng

| Task mở rộng | Người | Mô tả |
| :--- | :--- | :--- |
| API Admin (Kho, Sản phẩm, Doanh thu) | Thủy Tiên | Xử lý quản lý inventory gốc, thêm/sửa/xóa sản phẩm có công thức, lấy báo cáo doanh thu. |
| Trang Admin | Ngọc Hiển | Giao diện quản lý sản phẩm, nhập kho nguyên liệu/topping, xem báo cáo. |
| API Barista & State Machine | Gia Hân | Lấy danh sách đơn chờ, cập nhật trạng thái đơn (PAID -> PREPARING...). |
| Trang Barista | Hoàng Quân | Giao diện xem đơn đang chờ, cập nhật trạng thái. |
| Checkout Preview | Gia Hân | API `POST /checkout/preview` xem trước tổng tiền khi áp mã và điểm thưởng trước khi order. |
| Điểm thưởng (Loyalty) | Gia Hân | Tích điểm, trừ điểm khi mua hàng, API `GET /users/me/loyalty`. |
| Thông báo (Email) | Hoàng Quân | Gửi email xác nhận đơn (mock) khi đơn hàng chuyển sang PAID. |
