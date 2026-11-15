# ADR-002: Backend NestJS theo kiến trúc modular monolith

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-14
- Người quyết định: Nhóm phát triển

## Bối cảnh

Backend phải xử lý đặt hàng, thanh toán, kho, khuyến mãi, điểm thưởng, phân quyền. Một lần đặt hàng chạm nhiều bảng cùng lúc (đơn, kho, lượt dùng mã, điểm) và phải thành công hoặc thất bại trọn vẹn (NFR-10). Nhóm nhỏ, thời gian có hạn, một số thành viên mới học công nghệ.

## Quyết định

Dùng **NestJS** (TypeScript) làm một ứng dụng duy nhất, **chia module theo domain**: Auth, Products, Checkout, Orders, Payments, Discounts, Promotions, Loyalty, Inventory, Barista, Admin, cùng module hạ tầng (Prisma, Config, Jwt/Passport, Schedule). Mỗi module có controller, service và DTO riêng. Tài liệu API bằng Swagger tại `/api`.

## Phương án đã xét

| Phương án | Nhận xét |
|-----------|----------|
| Microservices (đơn hàng, thanh toán, kho tách riêng) | Cần giao dịch phân tán và hạ tầng phức tạp; quá nặng cho đồ án |
| Express thuần | Linh hoạt nhưng không có cấu trúc sẵn, dễ rối khi nhiều người cùng làm |
| API routes của Next.js | Gộp hai khối, nhưng khó tách nghiệp vụ và tác vụ định kỳ |
| **NestJS modular monolith** | Cấu trúc rõ, giao dịch dễ, một khối triển khai |

## Hệ quả

- Tích cực: transaction qua nhiều bảng dễ thực hiện; module tách trách nhiệm rõ; có sẵn guard, DTO, Swagger, Schedule; triển khai một khối.
- Tiêu cực: mở rộng quy mô theo cả khối; ranh giới module chỉ giữ được bằng kỷ luật của nhóm; người mới phải học decorator và dependency injection.
- Rủi ro: module phụ thuộc vòng nếu không kiểm soát; cần review để controller không chứa nghiệp vụ.
- Hướng tương lai: nếu cần, có thể tách Payments hoặc Inventory thành dịch vụ riêng vì đã có ranh giới module.
