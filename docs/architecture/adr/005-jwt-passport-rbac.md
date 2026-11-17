# ADR-005: Xác thực bằng JWT và Passport, phân quyền theo vai trò

## Bối cảnh

Hệ thống có ba vai trò (CUSTOMER, BARISTA, ADMIN) dùng chung một trang đăng nhập. Frontend và backend chạy ở hai cổng khác nhau. Cần chặn truy cập trái quyền (FR-04, NFR-05) và vô hiệu hóa token khi đăng xuất (FR-03). Đề bài yêu cầu JWT với Passport.

## Quyết định

- Dùng **Passport** với chiến lược **JWT** trong NestJS; token cấp khi đăng nhập thành công.
- Vai trò lưu trong `User.role` (`CUSTOMER` mặc định); guard kiểm tra vai trò trên từng nhóm route (`/barista`, `/admin`).
- `User.tokenVersion` tăng khi đăng xuất để token cũ mất hiệu lực.
- Mật khẩu lưu dạng băm (`passwordHash`).
- Frontend lưu token ở `localStorage` khóa `accessToken` và gửi trong header của mỗi yêu cầu cần đăng nhập.

## Phương án đã xét

| Phương án | Nhận xét |
|-----------|----------|
| Phiên (session) và cookie phía server | An toàn hơn với XSS, nhưng cần lưu phiên và cấu hình cookie giữa hai cổng |
| Đăng nhập bên thứ ba (Google, OAuth) | Ngoài phạm vi, thêm phụ thuộc ngoài |
| Token trong cookie `httpOnly` | An toàn hơn `localStorage`, nhưng phức tạp hơn khi frontend và backend khác nguồn gốc |
| **JWT, token trong `localStorage`** | Đơn giản, phù hợp quy mô đồ án |

## Hệ quả

- Tích cực: không cần lưu phiên; dễ gắn vào mọi API; phân quyền rõ.
- Tiêu cực: token trong `localStorage` có nguy cơ bị đánh cắp nếu có lỗ hổng XSS; để vô hiệu hóa token, hệ thống phải đối chiếu `tokenVersion` với cơ sở dữ liệu, nên không hoàn toàn stateless.
- Hướng cải tiến: chuyển token sang cookie `httpOnly` và bổ sung refresh token.
- Mọi API cần đăng nhập phải có ca kiểm thử về quyền truy cập (NFR-05).