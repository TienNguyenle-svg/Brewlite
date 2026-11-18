# BrewLite - Phần mềm đặt cà phê không dùng tiền mặt

## 1. Giới thiệu tổng quan
BrewLite là hệ thống website đặt đồ uống giao tận nơi tích hợp thanh toán không dùng tiền mặt qua cổng VNPay. Dự án cung cấp quy trình khép kín từ khâu khách hàng đặt món, thanh toán, đến khâu tiếp nhận đơn của nhân viên pha chế và kiểm soát tồn kho, doanh thu của cấp quản lý.

Đây là sản phẩm Bài tập lớn (Assignment 2) thuộc môn học Công nghệ Phần mềm, Khoa Công Nghệ Thông Tin, Trường Đại học Sài Gòn (Niên khóa 2026-2027).

## 2. Thành viên nhóm và vai trò
Dự án được phát triển bởi Nhóm 13, vận hành theo mô hình Agile Scrum:

- Nguyễn Lê Thủy Tiên (3124410353): Trưởng nhóm (Product Owner) & Backend Developer. Phụ trách hạ tầng Monorepo, cấu hình Docker, thiết lập CI/CD, thiết kế Database Schema, và phát triển API cho Sản phẩm, Đơn hàng, Quản trị.
- Trần Gia Hân (3123560023): Scrum Master & Backend Developer. Phụ trách API Xác thực (JWT), tích hợp thanh toán VNPay Sandbox, Order State Machine, hệ thống điểm thưởng, và tự động hóa kiểm thử (Unit, Integration, E2E).
- Nguyễn Bùi Ngọc Hiển (3124410087): Frontend Developer. Phụ trách giao diện Khách hàng (Thực đơn, Chi tiết sản phẩm, Đăng nhập, Lịch sử đơn) và giao diện Quản trị (Admin).
- Trịnh Bá Hoàng Quân (3122410347): Frontend Developer. Phụ trách quản lý trạng thái Giỏ hàng (Zustand), luồng thanh toán Checkout, và giao diện màn hình nhận đơn KDS cho Barista.

## 3. Công nghệ sử dụng (Tech Stack)
Dự án được tổ chức theo kiến trúc Monorepo, bao gồm:

- Frontend: Next.js (App Router), React, TypeScript, TailwindCSS, Zustand.
- Backend: NestJS, TypeScript, Passport, JWT.
- Cơ sở dữ liệu: PostgreSQL, Prisma ORM.
- Tích hợp ngoại vi: VNPay Sandbox (Thanh toán trực tuyến).
- Triển khai và CI/CD: Docker, GitHub Actions, Render Cloud Platform.
- Trình quản lý gói: pnpm.

## 4. Các tính năng chính
Hệ thống phân quyền theo 3 vai trò:

- Khách hàng (CUSTOMER): Đăng ký/Đăng nhập, xem thực đơn, tùy chỉnh kích cỡ và topping (tự động cập nhật giá), quản lý giỏ hàng, đặt hàng và thanh toán trực tuyến qua VNPay, theo dõi trạng thái đơn hàng và lịch sử.
- Nhân viên pha chế (BARISTA): Theo dõi danh sách đơn hàng đã thanh toán thông qua hệ thống KDS, cập nhật trạng thái pha chế (Đang pha chế, Sẵn sàng, Hoàn thành).
- Quản lý cửa hàng (ADMIN): Quản lý danh mục sản phẩm, kiểm soát tồn kho nguyên liệu và topping (tự động trừ kho theo công thức), theo dõi đơn hàng toàn hệ thống và xem báo cáo doanh thu.

## 5. Yêu cầu hệ thống
Để khởi chạy dự án trên môi trường cục bộ (local), máy tính của bạn cần cài đặt:

- Node.js (khuyến nghị phiên bản v18 hoặc v20 LTS).
- pnpm (Trình quản lý gói).
- Docker và Docker Compose (để khởi chạy cơ sở dữ liệu PostgreSQL).
- Git.

## 6. Hướng dẫn cài đặt và chạy dự án

Bước 1: Sao chép kho lưu trữ và cài đặt thư viện
```bash
git clone https://github.com/TienNguyenle-svg/Brewlite.git
cd BrewLite
pnpm install
```

Bước 2: Thiết lập biến môi trường
Tạo bản sao của tệp .env.example thành .env tại cả hai thư mục frontend và backend. Sau đó, cập nhật các thông số kết nối cơ sở dữ liệu và cấu hình VNPay tương ứng vào tệp .env.

Bước 3: Khởi chạy cơ sở dữ liệu bằng Docker
```bash
cd backend
docker-compose up -d
```

Bước 4: Cập nhật cấu trúc cơ sở dữ liệu và nạp dữ liệu mẫu
```bash
pnpm prisma migrate dev
pnpm prisma db seed
```

Bước 5: Khởi chạy Backend
```bash
pnpm run start:dev
```
Backend sẽ hoạt động tại http://localhost:3001

Bước 6: Khởi chạy Frontend
Mở một cửa sổ dòng lệnh (terminal) mới:
```bash
cd frontend
pnpm run dev
```
Frontend sẽ hoạt động tại http://localhost:3000.

## 7. Hướng dẫn sử dụng
- Truy cập giao diện chính của ứng dụng tại địa chỉ http://localhost:3000.
- Bạn có thể tạo một tài khoản khách hàng mới để trải nghiệm luồng mua hàng và thanh toán.
- Để kiểm tra các phân hệ quản lý nội bộ, hãy sử dụng các tài khoản đã được khởi tạo sẵn qua dữ liệu mẫu (seed):
  - Quản lý (Admin): admin@brewlite.com
  - Nhân viên (Barista): barista@brewlite.com
  (Mật khẩu mặc định có thể tham khảo trực tiếp trong tệp backend/prisma/seed.ts).

## 8. Link Web Render (Môi trường Production)
Dự án đã được tự động hóa quy trình triển khai (CI/CD) và vận hành thực tế trên Render Cloud Platform. Quý vị có thể truy cập và trải nghiệm hệ thống qua các liên kết sau:

- URL Frontend (Giao diện người dùng): [https://brewlite-frontend-14js.onrender.com](https://brewlite-frontend-l4js.onrender.com)
- URL Backend API (Máy chủ): [https://brewlite-backend-7mac.onrender.com/api](https://brewlite-backend-7mac.onrender.com/api)
- URL Health Check: [https://brewlite-backend-7mac.onrender.com/health](https://brewlite-backend-7mac.onrender.com/health)
