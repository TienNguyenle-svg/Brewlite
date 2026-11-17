# ADR-006: Thanh toán qua VNPay (sandbox), dùng IPN và khóa idempotency

## Bối cảnh

BrewLite chỉ nhận thanh toán không dùng tiền mặt (xem `context-and-scope.md`). Đồ án cần một dịch vụ thanh toán mô phỏng, không phát sinh tiền thật nhưng có luồng gần với thực tế. Thanh toán phải chống ghi nhận trùng và chống giả mạo (FR-28, FR-29, NFR-07).

## Quyết định

- Dùng **VNPay môi trường sandbox** làm dịch vụ thanh toán mô phỏng.
- Luồng: backend tạo bản ghi `Payment` (`PENDING`) kèm `idempotencyKey` duy nhất và `expiresAt`, sinh URL có chữ ký, chuyển khách sang VNPay.
- **IPN** (`GET /payments/vnpay-ipn`) là căn cứ chính để đổi trạng thái đơn và thanh toán. **Return URL** (`GET /payments/vnpay-return`) chủ yếu để hiển thị kết quả cho khách.
- Mọi dữ liệu từ VNPay phải được kiểm tra chữ ký và đối chiếu số tiền trước khi xử lý.
- Xử lý IPN lặp lại an toàn (idempotent): không trừ kho, không cộng điểm, không ghi lượt dùng mã lần hai.
- Cấu hình VNPay (mã đối tác, khóa bí mật, URL) đọc từ biến môi trường.

## Phương án đã xét

| Phương án | Nhận xét |
|-----------|----------|
| Tự viết cổng thanh toán giả (mock) | Dễ chạy trên máy cá nhân, nhưng không thể hiện được chữ ký, IPN như thực tế |
| Stripe hoặc PayPal | Không phổ biến ở Việt Nam, khó thử nghiệm với ngân hàng nội địa |
| MoMo, ZaloPay | Khả thi, nhưng nhóm đã chọn VNPay vì tài liệu sandbox rõ |
| Thanh toán tiền mặt (COD) | Ngoài phạm vi, không phù hợp mục tiêu |
| **VNPay sandbox** | Gần thực tế, không tốn tiền |

## Hệ quả

- Tích cực: có đủ luồng thanh toán thật (chữ ký, IPN, return URL, kết quả lỗi); khóa idempotency chặn thanh toán trùng.
- Tiêu cực: **IPN cần địa chỉ công khai**, máy chạy `localhost` không nhận được; khi demo phải dùng đường hầm (ví dụ ngrok) hoặc có kịch bản dự phòng (use-case luồng E13).
- Rủi ro: sandbox có thể hành xử khác bản chính thức; hoàn tiền tự động chưa làm (FR-50).