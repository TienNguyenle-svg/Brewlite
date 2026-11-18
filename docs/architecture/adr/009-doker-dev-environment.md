# ADR-009: Dùng Docker cho môi trường phát triển

## Bối cảnh

Mỗi thành viên có máy khác nhau; cài PostgreSQL trực tiếp dễ lệch phiên bản và cấu hình. Một số lỗi đã gặp xuất phát từ database mỗi máy một kiểu. Yêu cầu NFR-19 đến NFR-21 đòi hỏi dựng được môi trường từ máy sạch.

## Quyết định

Dùng **Docker** để chạy PostgreSQL với cấu hình thống nhất (database `brewlite`, cổng 5432), kèm hướng dẫn trong README. Backend và frontend vẫn chạy trực tiếp bằng pnpm trong lúc phát triển để tiện sửa mã và tải lại nóng. **[Cần xác nhận: nhóm có đóng gói cả backend và frontend vào Docker (docker compose) hay không.]**

## Phương án đã xét

| Phương án | Nhận xét |
|-----------|----------|
| Cài PostgreSQL trực tiếp trên máy | Dễ lệch phiên bản, cấu hình |
| Dùng cơ sở dữ liệu đám mây dùng chung | Mọi người thấy cùng dữ liệu nhưng dễ ghi đè dữ liệu của nhau, cần Internet |
| Docker cho cả ba thành phần | Đồng nhất nhất, nhưng chậm khi phát triển và thêm cấu hình |
| **Docker cho PostgreSQL** | Đồng nhất phần dễ lệch nhất, giữ vòng lặp phát triển nhanh |

## Hệ quả

- Tích cực: môi trường cơ sở dữ liệu giống nhau giữa các máy; dựng lại từ đầu bằng một lệnh; dễ xóa và tạo lại khi cần.
- Tiêu cực: mọi người phải cài Docker Desktop; cần quen vài lệnh Docker.
- Việc cần làm: viết README hướng dẫn khởi động database, chạy migration và seed; cung cấp tệp `.env.example`.