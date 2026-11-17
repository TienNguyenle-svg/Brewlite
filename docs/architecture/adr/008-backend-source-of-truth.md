# ADR-008: Backend là nguồn chuẩn của giá và quy tắc nghiệp vụ

## Bối cảnh

Frontend cần hiển thị ngay tạm tính, phí giao, giảm giá, tổng khi khách đổi giỏ, nên có hàm tính riêng (`useCart`, `calcDiscount`, `validatePromo`). Nhưng giá thật phải đáng tin cậy và không bị sửa từ trình duyệt (FR-22, NFR-09). Thực tế đã có lệch: ngưỡng miễn phí giao hàng quy tắc nhóm là 100.000đ, còn hằng số `FREE_DELIVERY_THRESHOLD` ở frontend đang là 150.000đ.

## Quyết định

- **Backend tính lại và lưu** mọi con số tiền (đơn giá, tạm tính, phí giao, giảm giá, tổng) khi tạo đơn; bỏ qua giá do client gửi.
- Frontend chỉ **hiển thị và ước tính**; số cuối cùng trước khi đặt lấy từ `POST /checkout/preview`.
- Quy tắc nghiệp vụ (giá theo size, ngưỡng miễn phí giao hàng, điều kiện mã giảm giá) được định nghĩa một lần trong tài liệu (`srs.md`, mục BR) và hiện thực ở backend; phần ước tính ở frontend phải khớp.

## Phương án đã xét

| Phương án | Nhận xét |
|-----------|----------|
| Frontend tính, backend tin | Nhanh, nhưng dễ gian lận giá |
| Chỉ backend tính, frontend luôn gọi API | Chính xác tuyệt đối, nhưng chậm và nhiều yêu cầu mạng khi đổi giỏ |
| **Backend chuẩn, frontend ước tính, preview xác nhận** | Cân bằng độ chính xác và trải nghiệm |

## Hệ quả

- Tích cực: một nguồn chuẩn, khó gian lận giá; số tiền trong đơn luôn đúng với quy tắc.
- Tiêu cực: logic tính giá tồn tại ở hai nơi nên có thể lệch (đã lệch ngưỡng free ship).
- Việc cần làm: thống nhất ngưỡng (100.000đ hay 150.000đ), sửa một nơi cho khớp; về lâu dài lấy các hằng số như ngưỡng và phí giao từ API thay vì viết cứng ở frontend.