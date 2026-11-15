# ADR-004: Dùng PostgreSQL với Prisma ORM và Prisma Migrate

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-14
- Người quyết định: Nhóm phát triển

## Bối cảnh

Dữ liệu của BrewLite có nhiều quan hệ: đơn - món - topping, món - công thức - nguyên liệu, mã khuyến mãi - lượt dùng. Cần giao dịch ACID cho đặt hàng và thanh toán (NFR-10, NFR-11), ràng buộc duy nhất (khóa idempotency, mỗi tài khoản một mã một lần) và chỉ mục để truy vấn nhanh. Nhiều người cùng sửa schema nên cần lịch sử thay đổi có kiểm soát.

## Quyết định

- **PostgreSQL** làm cơ sở dữ liệu (database `brewlite`).
- **Prisma ORM** làm lớp truy cập dữ liệu, schema định nghĩa trong `prisma/schema.prisma`, dùng `$transaction` cho các thao tác nhiều bước.
- **Prisma Migrate** quản lý thay đổi schema.

Quy ước làm việc:

1. Sửa `schema.prisma`, chạy `prisma migrate dev --name <ten>` để tạo migration, sau đó `prisma generate` (lệnh `migrate dev` tự chạy).
2. Commit cả thư mục `prisma/migrations`.
3. **Không sửa tay** migration đã áp dụng.
4. `prisma db push` chỉ dùng cho thử nghiệm cá nhân, không dùng làm quy trình chung.
5. Môi trường chạy thật dùng `prisma migrate deploy`.

## Phương án đã xét

| Phương án | Nhận xét |
|-----------|----------|
| MongoDB | Linh hoạt nhưng thiếu ràng buộc quan hệ và giao dịch mạnh như nhu cầu đặt hàng và kho |
| MySQL | Dùng được, nhưng nhóm chọn PostgreSQL vì tính năng ràng buộc và kiểu dữ liệu phong phú |
| TypeORM hoặc Sequelize | Kiểu an toàn kém hơn Prisma; schema khó đọc hơn |
| **PostgreSQL + Prisma** | Quan hệ, ACID, kiểu an toàn, migration có lịch sử |

## Hệ quả

- Tích cực: giao dịch đáng tin cậy; ràng buộc duy nhất chặn dữ liệu trùng ở tầng cơ sở dữ liệu; Prisma Client sinh kiểu TypeScript nên lỗi sai tên trường bị bắt lúc biên dịch.
- Tiêu cực: sau mỗi lần đổi schema phải `generate` và migrate, nếu quên sẽ gặp lỗi (đã gặp: lỗi TypeScript vì Prisma Client cũ, lỗi `P2022` vì cột chưa có trong database, lỗi drift vì migration bị sửa sau khi áp dụng).
- Rủi ro: mỗi máy một database có thể lệch nhau; cần seed chung và quy trình migrate thống nhất (NFR-21).
