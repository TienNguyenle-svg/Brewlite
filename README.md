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
├── backend/                    # NestJS Backend [Task 1]
│   ├── prisma/                 # Database [Task 1, Task 2]
│   │   ├── schema.prisma       # Định nghĩa các bảng [Task 2, Task 7, Task 10]
│   │   ├── seed.ts             # Dữ liệu mẫu [Task 2]
│   │   └── migrations/         # Lịch sử migrate [Task 1, Task 2]
│   ├── src/                    # Source code
│   │   ├── prisma/             # Module Prisma [Task 1]
│   │   ├── products/           # Module sản phẩm [Task 2]
│   │   ├── auth/               # Module đăng nhập [Task 7]
│   │   ├── orders/             # Module đơn hàng [Task 6, Task 9, Task 10]
│   │   ├── payments/           # Module thanh toán [Task 8, Task 10]
│   │   ├── admin/              # Module quản trị (Task mở rộng)
│   │   ├── barista/            # Module pha chế (Task mở rộng)
│   │   ├── app.module.ts       # Module gốc [Task 1]
│   │   └── main.ts             # Khởi động app [Task 1]
│   ├── test/                   # Test tự động [Task 10]
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   └── Dockerfile              # Containerize Backend [Task 9]
│
├── frontend/                   # Next.js Frontend [Task 1]
│   ├── app/                    # App Router
│   │   ├── page.tsx            # Trang Menu [Task 3]
│   │   ├── products/[id]/      # Chi tiết sản phẩm [Task 4]
│   │   ├── cart/               # Giỏ hàng [Task 5]
│   │   ├── checkout/           # Thanh toán [Task 8]
│   │   ├── orders/             # Lịch sử đơn [Task 9]
│   │   ├── login/              # Đăng nhập [Task 7]
│   │   ├── admin/              # Khu vực quản trị (Task mở rộng)
│   │   ├── barista/            # Khu vực pha chế (Task mở rộng)
│   │   ├── layout.tsx          # Layout chung [Task 1, Task 3]
│   │   └── globals.css         # CSS toàn cục [Task 1]
│   ├── components/             # Component tái sử dụng [Task 3, Task 4]
│   ├── lib/                    # Hàm gọi API [Task 3, Task 6, Task 7, Task 8]
│   ├── store/                  # Zustand store [Task 5]
│   ├── public/                 # Ảnh, icon [Task 3]
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── Dockerfile              # Containerize Frontend [Task 9]
│
├── report/                     # File đề bài
│   └── Assignment2-BrewLite.pdf
│   └── BrewLite-CongNghePhanMem.pdf
│
├── docker-compose.yml          # Chạy toàn bộ hệ thống [Task 9]
├── .env.example                # Biến môi trường mẫu [Task 1]
├── .gitignore
├── README.md                   # Tài liệu hướng dẫn [Task 1, Task 9]
└── setup.md                    # Hướng dẫn cài đặt [Task 1]
```

### Nguyên tắc tổ chức
- **Backend:** Tổ chức theo chức năng (feature-based), không theo loại file. Mỗi chức năng = 1 thư mục trong src/. Trong mỗi thư mục: controller, service, module, dto/.
- **Frontend:** Tổ chức theo route (App Router của Next.js). Mỗi màn hình = 1 thư mục trong app/. Component tái sử dụng đặt trong components/.
- **Database:** Schema Prisma đặt trong backend/prisma/. Seed data trong backend/prisma/seed.ts. Migration tự sinh trong backend/prisma/migrations/.

## API Endpoints

| Task | Method | Endpoint | Chức năng | Auth |
|:---:|--------|----------|-----------|------|
| **Task 1** | GET | / | Kiểm tra trạng thái App | Không |
| **Task 7** | POST | /auth/register | Đăng ký tài khoản | Không |
| **Task 7** | POST | /auth/login | Đăng nhập và nhận JWT | Không |
| **Task 7** | POST | /auth/logout | Đăng xuất và vô hiệu hóa JWT | Có |
| **Task 2** | GET | /products | Lấy danh sách sản phẩm (Mặc định: Bán chạy) | Không |
| **Task 2 / 4** | GET | /products/{id} | Lấy chi tiết sản phẩm theo ID | Không |
| **Task 10** | POST | /checkout/preview | Xem trước tổng tiền theo giỏ hàng, voucher, điểm và phí ship | Có |
| **Task 6 / 10** | POST | /orders | Tạo đơn hàng mới (PENDING) | Có |
| **Task 9** | GET | /orders/me | Xem lịch sử đơn hàng | Có |
| **Task 10** | PATCH | /orders/{id}/cancel | Khách hủy đơn (Chỉ khi PAID) và hoàn tiền, hoàn kho | Có |
| **Task 8 / 10** | POST | /payments | Tạo URL thanh toán VNPay, chỉ dành cho CUSTOMER | Có |
| **Task 8 / 10** | POST | /payments/orders/{orderId}/cancel | Khách hủy đơn (sau khi thanh toán lỗi hoặc chưa có lượt thanh toán còn hạn) | Có |
| **Task 8 / 10** | GET | /payments/vnpay-return | Xác minh kết quả thanh toán trả về từ VNPay | Không |
| **Task 10** | GET | /users/me/loyalty | Xem số điểm thưởng và lịch sử điểm | Có |
| **Mở rộng** | GET | /barista/orders | Lấy danh sách đơn hàng Barista | Có |
| **Task 10** | PATCH | /barista/orders/{id} | Cập nhật trạng thái đơn hàng pha chế | Có |
| **Mở rộng** | POST | /admin/products | Thêm sản phẩm mới (kèm công thức) | Có |
| **Mở rộng** | PATCH | /admin/products/{id} | Cập nhật sản phẩm | Có |
| **Mở rộng** | DELETE | /admin/products/{id} | Xóa sản phẩm | Có |
| **Mở rộng** | GET | /admin/inventory | Xem toàn bộ tồn kho (Nguyên liệu và Topping) | Có |
| **Mở rộng** | POST | /admin/ingredients | Thêm nguyên liệu mới vào kho | Có |
| **Mở rộng** | POST | /admin/ingredients/{id}/import | Nhập thêm nguyên liệu đã có vào kho | Có |
| **Mở rộng** | POST | /admin/toppings | Thêm topping mới vào kho | Có |
| **Mở rộng** | POST | /admin/toppings/{id}/import | Nhập thêm topping đã có vào kho | Có |
| **Mở rộng** | GET | /admin/reports/revenue | Xem báo cáo doanh thu | Có |
| **Mở rộng** | GET | /admin/orders | Xem danh sách tất cả đơn hàng | Có |

## Thực thể chính
- **Product:** id, name, price, imageUrl, stock (tính toán dựa trên công thức) `[Task 2]`
- **Ingredient & Topping:** id, name, stock, unit (Quản lý tồn kho) `[Task 10]`
- **User:** id, email, passwordHash, loyaltyPoints, role `[Task 7, Task 10]`
- **Order:** id, userId, status, total, createdAt, promotionId `[Task 6, Task 9, Task 10]`
- **OrderItem:** id, orderId, productId, size, qty, unitPrice, lineTotal `[Task 6]`
- **Payment:** id, orderId, amount, method, status, transactionId `[Task 8, Task 10]`
- **Promotion:** id, code, discount, type, minOrder, expiredAt, active `[Task 10]`
- **LoyaltyTransaction:** id, userId, points, reason, orderId `[Task 10]`

## Order State Machine `[Task 10]`
```
PENDING → PAID → PREPARING → READY → COMPLETED
   ↓
PAYMENT_FAILED (Có thể thử lại hoặc hủy qua /payments/orders/{orderId}/cancel)
   ↓
CANCELLED (Hủy bởi khách qua /orders/{id}/cancel hoặc hệ thống tự hủy)
```

## Chức năng chính

### Khách hàng
| Task | Chức năng | Mô tả | API | BE | FE |
|:---:|:--- |:--- |:--- |:--- |:--- |
| **Task 2 & 3** | Xem menu | Danh sách đồ uống kèm hình, tên, giá | GET `/products` | Thủy Tiên | Ngọc Hiển |
| **Task 4** | Xem chi tiết | Chọn size (S/M/L), topping | GET `/products/{id}` | Thủy Tiên | Ngọc Hiển |
| **Task 5** | Giỏ hàng | Thêm/sửa/xóa, tính tổng tiền | (Zustand) | (Không cần API) | Hoàng Quân |
| **Task 10** | Checkout Preview | Xem trước tổng tiền, áp mã, điểm | POST `/checkout/preview` | Gia Hân | Hoàng Quân |
| **Task 7** | Đăng ký | Tạo tài khoản mới | POST `/auth/register` | Gia Hân | Ngọc Hiển |
| **Task 7** | Đăng nhập | Nhận JWT token | POST `/auth/login` | Gia Hân | Ngọc Hiển |
| **Task 6** | Tạo đơn hàng | Đặt đơn, trạng thái PENDING | POST `/orders` | Thủy Tiên | Hoàng Quân |
| **Task 8** | Thanh toán | Chọn Ví/Thẻ, chuyển hướng VNPay | POST `/payments` | Gia Hân | Hoàng Quân |
| **Task 10** | Hủy đơn | Hủy đơn khi lỗi thanh toán hoặc PAID | PATCH `/orders/{id}/cancel` | Gia Hân | Ngọc Hiển |
| **Task 9** | Lịch sử đơn | Xem các đơn đã đặt | GET `/orders/me` | Thủy Tiên | Ngọc Hiển |
| **Task 10** | Điểm thưởng | Xem điểm và lịch sử điểm | GET `/users/me/loyalty` | Gia Hân | Ngọc Hiển |

### Barista (mở rộng)
| Task | Chức năng | Mô tả | API | BE | FE |
|:---:|:--- |:--- |:--- |:--- |:--- |
| **Mở rộng** | Xem đơn chờ | Danh sách đơn đang chờ pha chế | GET `/barista/orders` | Gia Hân | Hoàng Quân |
| **Task 10** | Cập nhật trạng thái | PAID → PREPARING → READY → COMPLETED | PATCH `/barista/orders/{id}` | Gia Hân | Hoàng Quân |

### Admin (mở rộng)
| Task | Chức năng | Mô tả | API | BE | FE |
|:---:|:--- |:--- |:--- |:--- |:--- |
| **Mở rộng** | Quản lý sản phẩm | Thêm/sửa/xóa sản phẩm | POST/PATCH/DELETE `/admin/products` | Thủy Tiên | Ngọc Hiển |
| **Mở rộng / 10** | Quản lý kho | Nhập nguyên liệu, topping, xem tồn kho | GET, POST `/admin/inventory...` | Thủy Tiên | Ngọc Hiển |
| **Mở rộng** | Quản lý đơn hàng | Xem toàn bộ đơn hàng | GET `/admin/orders` | Thủy Tiên | Ngọc Hiển |
| **Mở rộng** | Báo cáo doanh thu | Xem doanh thu theo ngày/tháng | GET `/admin/reports/revenue` | Thủy Tiên | Ngọc Hiển |

## Phân chia công việc

| Task | Thành viên | Vai trò | Task chính | Hỗ trợ |
|:---:|:--- |:---: |:--- |:--- |
| **Task 1, 2, 6, 9** | **Thủy Tiên** | PO + BE | **Khởi tạo cấu trúc dự án, viết README, SETUP.md**. Thiết kế **Database & Schema**. Viết API Sản phẩm, Đơn hàng khách, API Admin (Kho, Sản phẩm, Báo cáo, Đơn hàng). | Hỗ trợ Gia Hân, quản lý Sprint, Demo. |
| **Task 7, 8, 10** | **Gia Hân** | SM + BE | Thiết kế **Database & Schema**. Viết API Auth, API Thanh toán (VNPay), API Checkout Preview, API Barista, Order State Machine, API Điểm thưởng. | Hỗ trợ Tiên phần CSDL, tổ chức Scrum/Retro. |
| **Task 3, 4, 7, 9** | **Ngọc Hiển** | FE | Giao diện: Trang Menu, Chi tiết sản phẩm, Auth, Lịch sử đơn/Hủy đơn, Trang Admin (Quản lý kho, Sản phẩm, Báo cáo). | Review UI, hỗ trợ Hoàng Quân. |
| **Task 5, 8, 10** | **Hoàng Quân** | FE | Giao diện: Giỏ hàng (Zustand), Checkout (xem trước tổng tiền, chọn thanh toán), Trang Barista (xem/cập nhật đơn). | Hỗ trợ Ngọc Hiển và review |

## Giải thích chi tiết từng người

### Thủy Tiên – PO + BE
- **Khởi tạo:** Thiết lập cấu trúc dự án, cấu hình Docker, viết tài liệu README.md và setup.md `[Task 1, Task 9]`.
- **Database:** Chịu trách nhiệm chính thiết kế Schema Prisma cho các bảng (cùng Gia Hân) `[Task 2, Task 6, Task 9]`.
- **Task Backend:** API danh sách/chi tiết sản phẩm `[Task 2]`, tạo và xem đơn hàng của khách hàng `[Task 6, Task 9]`. Xây dựng toàn bộ luồng API Admin (Quản lý tồn kho chi tiết nguyên liệu, topping, quản lý sản phẩm, báo cáo doanh thu và xem toàn bộ đơn hàng).
- **Khác:** Quản lý Product Backlog, Sprint Planning, Review, Demo `[Task 9]`.

### Gia Hân – SM + BE
- **Database:** Chịu trách nhiệm chính thiết kế Schema Prisma (đặc biệt bảng Payment, Promotion, Loyalty) cùng Thủy Tiên `[Task 7, Task 8, Task 10]`.
- **Task Backend:** Xử lý luồng xác thực (Register, Login, Logout, JWT) `[Task 7]`. Tích hợp thanh toán VNPay (tạo URL, xử lý callback) `[Task 8]`. API xem trước tổng tiền (Checkout preview), luồng điểm thưởng `[Task 10]`. Xây dựng API cho Barista và quản lý chuyển đổi trạng thái đơn hàng (Order State Machine) `[Task 10]`.
- **Khác:** Tổ chức Daily Scrum, Sprint Retrospective.

### Ngọc Hiển – FE 
- **Task Frontend Khách hàng:** Xây dựng màn hình danh sách đồ uống `[Task 3]`, chi tiết sản phẩm `[Task 4]`, luồng đăng nhập/đăng ký `[Task 7]`, xem lịch sử đơn hàng và chức năng khách tự hủy đơn `[Task 9]`.
- **Task Frontend Admin:** Xây dựng dashboard quản lý kho nguyên liệu/topping (thêm mới, import), quản lý sản phẩm dựa trên công thức, xem báo cáo doanh thu và quản lý toàn bộ đơn hàng.
- **Khác:** Review UI, hỗ trợ Hoàng Quân.

### Hoàng Quân – FE
- **Task Frontend Khách hàng:** Quản lý state giỏ hàng (Zustand) `[Task 5]`, xây dựng màn hình thanh toán tổng hợp (áp dụng voucher, điểm thưởng từ API preview) và chuyển hướng thanh toán VNPay `[Task 8]`.
- **Task Frontend Barista:** Xây dựng màn hình xem danh sách đơn đang chờ và nút cập nhật trạng thái pha chế `[Task 10]`.
- **Khác:** Hỗ trợ Ngọc Hiển và review.

## Bảng database (Chịu trách nhiệm chính: Tiên & Hân)

| Task | Bảng | Trách nhiệm thiết kế chính |
|:---:|:--- |:--- |
| **Task 2** | Product | Thủy Tiên |
| **Task 10** | Ingredient / Topping | Thủy Tiên |
| **Task 7** | User | Thủy Tiên |
| **Task 6 / 9** | Order / OrderItem | Thủy Tiên |
| **Task 8** | Payment | Gia Hân |
| **Task 10** | Promotion | Gia Hân |
| **Task 10** | LoyaltyTransaction | Gia Hân |

## Bảng thanh toán

| Task | Phần | Người phụ trách | Công việc |
|:---:|:--- |:--- |:--- |
| **Task 8 & 10** | Backend | Gia Hân | POST `/payments`, xử lý callback VNPay, tính tổng tiền Checkout Preview, API Hủy đơn hoàn tiền. |
| **Task 8** | Frontend | Hoàng Quân | Trang thanh toán, xem trước hóa đơn, chọn phương thức, chuyển hướng VNPay. |
| **Task 10** | State Machine | Gia Hân | Cập nhật PENDING → PAID hoặc PENDING → PAYMENT_FAILED → CANCELLED. |

## Bảng Sprint

| Task / Sprint | Thủy Tiên (BE) | Gia Hân (BE) | Ngọc Hiển (FE) | Hoàng Quân (FE) |
|:---:|:--- |:--- |:--- |:--- |
| **Sprint 1** | Khởi tạo dự án, cấu hình Docker, README, Schema DB, API Sản phẩm **[Task 1, 2]**. | Schema DB (cùng Tiên), API Auth (Login/Register) **[Task 7]**. | Trang Menu, Chi tiết sản phẩm, Đăng nhập/Đăng ký **[Task 3, 4, 7]**. | Giỏ hàng (Zustand) **[Task 5]**, Seed data (Hỗ trợ DB). |
| **Sprint 2** | API Đơn hàng (Tạo, Xem lịch sử) **[Task 6, 9]**. | API Thanh toán (VNPay), Checkout Preview, Hủy đơn **[Task 8, 10]**. | Xác nhận đơn, Lịch sử đơn **[Task 9]**. | Trang Checkout, chuyển hướng VNPay **[Task 8]**. |
| **Sprint 3** | API Admin (Sản phẩm, Kho, Doanh thu) **[Mở rộng]**. | API Barista, Order State Machine, API Loyalty **[Task 10]**. | Trang Admin (Quản lý kho, Sản phẩm, Báo cáo) **[Mở rộng]**. | Trang Barista **[Task 10]**. |
| **Cuối kỳ** | Demo, Sprint Review **[Task 9]**. | Sprint Retrospective, hoàn thiện luồng State Machine **[Task 10]**. | Hoàn thiện UI/UX. | Chạy thử toàn hệ thống nghiệm thu **[Task 9]**. |

## Danh sách task mở rộng

| Task | Task mở rộng | Người | Mô tả |
|:---:|:--- |:--- |:--- |
| **Mở rộng (từ Task 2 & 10)** | API Admin (Kho, Sản phẩm, Doanh thu) | Thủy Tiên | Xử lý quản lý inventory gốc, thêm/sửa/xóa sản phẩm có công thức, lấy báo cáo doanh thu. |
| **Mở rộng (từ Task 3)** | Trang Admin | Ngọc Hiển | Giao diện quản lý sản phẩm, nhập kho nguyên liệu/topping, xem báo cáo. |
| **Task 10** | API Barista & State Machine | Gia Hân | Lấy danh sách đơn chờ, cập nhật trạng thái đơn (PAID -> PREPARING...). |
| **Task 10** | Trang Barista | Hoàng Quân | Giao diện xem đơn đang chờ, cập nhật trạng thái. |
| **Task 10** | Checkout Preview | Gia Hân | API `POST /checkout/preview` xem trước tổng tiền khi áp mã và điểm thưởng trước khi order. |
| **Task 10** | Điểm thưởng (Loyalty) | Gia Hân | Tích điểm, trừ điểm khi mua hàng, API `GET /users/me/loyalty`. |
| **Task 8 & 10** | Thông báo (Email) | Hoàng Quân | Gửi email xác nhận đơn (mock) khi đơn hàng chuyển sang PAID. |
