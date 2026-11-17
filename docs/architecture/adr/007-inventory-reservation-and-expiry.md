# ADR-007: Giữ chỗ kho khi tạo đơn, dùng transaction và tự hủy đơn quá hạn

## Bối cảnh

Đơn được tạo trước, thanh toán sau (có thể mất vài phút trên VNPay). Nếu không giữ hàng trong thời gian chờ, hai khách có thể cùng đặt món cuối cùng. Nếu trừ kho ngay khi tạo đơn, đơn bỏ dở sẽ làm hao kho vô ích (NFR-11, FR-23, FR-24).

## Quyết định

1. Khi tạo đơn, **giữ chỗ** nguyên liệu và topping bằng cột `reservedQuantity` (và điểm bằng `reservedPoints`), trong **một transaction** cùng việc tạo đơn. Tồn khả dụng = tồn kho − phần giữ chỗ.
2. Khi đơn lên `PAID`, chuyển giữ chỗ thành **trừ kho thực** theo công thức, size và số lượng.
3. Một **tác vụ định kỳ** (`@nestjs/schedule`) tìm đơn `PENDING` quá 10 phút, chuyển sang `CANCELLED` và trả lại phần giữ chỗ.
4. Nếu một nguyên liệu hoặc topping không đủ tồn khả dụng thì từ chối tạo đơn.

## Phương án đã xét

| Phương án | Nhận xét |
|-----------|----------|
| Trừ kho ngay khi tạo đơn | Đơn bỏ dở làm hao kho, cần hoàn kho phức tạp |
| Chỉ trừ kho khi thanh toán xong | Có thể bán vượt tồn kho khi nhiều người đặt cùng lúc |
| Hàng đợi có độ trễ (ví dụ BullMQ với Redis) | Chính xác hơn nhưng thêm hạ tầng, không cần cho quy mô này |
| **Giữ chỗ + cron trong tiến trình API** | Đơn giản, đủ chính xác |

## Hệ quả

- Tích cực: không bán vượt tồn kho; đơn treo tự giải phóng; thao tác nguyên tử nhờ transaction.
- Tiêu cực: logic nhiều bước, dễ sai nếu thiếu kiểm thử; độ trễ tự hủy tối đa khoảng một chu kỳ cron.
- Rủi ro: tác vụ định kỳ nằm trong tiến trình API, nếu chạy nhiều bản song song thì xử lý trùng (cần khóa hoặc tách riêng khi mở rộng); một lần chạy lỗi không được làm dừng các lần sau (NFR-12). Lỗi lệch schema từng làm tác vụ này báo `P2022`.