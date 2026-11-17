# ADR-010: Quản lý cấu hình, logging và health check

## Bối cảnh

Hệ thống có nhiều bí mật và giá trị thay đổi theo máy: địa chỉ cơ sở dữ liệu, khóa JWT, thông tin VNPay, địa chỉ backend. Cần theo dõi lỗi khi chạy (đã có lỗi truy vấn `P2022`, lỗi kết nối) và biết hệ thống còn sống không (NFR-08, NFR-12, NFR-20).

## Quyết định

**Cấu hình**
- Mọi cấu hình đọc từ biến môi trường (`.env`) qua module cấu hình của NestJS; frontend dùng biến `NEXT_PUBLIC_...` cho địa chỉ backend.
- `.env` nằm trong `.gitignore`; repo có `.env.example` liệt kê đủ biến cần thiết.
- Không viết cứng khóa bí mật trong mã nguồn.

**Logging**
- Dùng `Logger` của NestJS, ghi ra console với mức `LOG` và `ERROR`.
- Ghi log các sự kiện nghiệp vụ quan trọng: khởi động, tạo thanh toán, nhận IPN, hủy đơn quá hạn, lỗi tác vụ định kỳ, lỗi truy vấn.
- Không ghi mật khẩu, token hoặc khóa bí mật vào log.

**Health check (đề xuất)**
- Thêm endpoint `GET /health` trả trạng thái ứng dụng và kết nối PostgreSQL (có thể dùng `@nestjs/terminus`). Hiện chưa có trong danh sách route của backend.

## Phương án đã xét

| Phương án | Nhận xét |
|-----------|----------|
| Cấu hình viết cứng trong mã | Đơn giản nhưng lộ bí mật, khó đổi theo môi trường |
| Dịch vụ quản lý bí mật (Vault, Secret Manager) | Quá nặng cho đồ án |
| Thư viện log nâng cao (Winston, Pino) và gom log tập trung | Hữu ích khi chạy thật, chưa cần cho đồ án |
| **`.env` + Logger mặc định + health check đơn giản** | Đủ dùng, ít phụ thuộc |

## Hệ quả

- Tích cực: dễ đổi cấu hình giữa các máy; không lộ bí mật khi đẩy mã lên Git; log giúp tìm lỗi nhanh.
- Tiêu cực: log chỉ ra console, mất khi tắt tiến trình; chưa có cảnh báo tự động.
- Việc cần làm: tạo `.env.example`; quyết định có làm health check hay không và ghi rõ tên endpoint.