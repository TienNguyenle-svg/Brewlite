# BrewLite v1.0.0

Phiên bản MVP cho quy trình đặt đồ uống và quản lý cửa hàng, phát triển qua bốn Sprint theo phạm vi trong [mẫu Assignment SGU](../Assigment_template_SGU.pdf). Ghi chú này đối chiếu với mã nguồn hiện có; các kết quả được nêu trong báo cáo nhưng chưa có cấu hình hoặc kiểm thử tương ứng trong repository không được xem là đã xác minh tại đây.

## Tính năng

- Menu đồ uống, tìm kiếm/lọc, xem chi tiết và tùy chỉnh size/topping.
- Đăng ký/đăng nhập, giỏ hàng, thông tin nhận hàng, tạo đơn và xem lịch sử.
- Thanh toán VNPay, xác minh callback, trạng thái thanh toán, thử lại và hủy đơn theo điều kiện.
- Quản lý vòng đời đơn, chống tạo lượt thanh toán trùng bằng `Idempotency-Key`, kiểm tra tồn kho khi đặt đơn và tự xử lý đơn/lượt thanh toán hết hạn.
- Checkout preview, khuyến mãi và điểm thưởng.
- Màn hình Barista theo dõi/cập nhật trạng thái đơn; Admin quản lý sản phẩm, kho, đơn hàng và doanh thu.
- PostgreSQL/Prisma, API NestJS và frontend Next.js; Docker Compose phục vụ chạy demo.

## Giới hạn và lưu ý phát hành

- VNPay cần thông tin cấu hình sandbox/production; repository không xác minh giao dịch production.
- Hàng đợi Barista làm mới định kỳ; chưa phải cập nhật thời gian thực qua WebSocket.
- Chưa có benchmark hiệu năng hoặc kiểm thử tương thích đa trình duyệt được lưu trong repository.
- Mẫu Assignment mô tả 92 test case và triển khai Render; repository hiện có test backend, không có bộ test tự động frontend hay cấu hình Render để xác nhận các kết quả đó.
- US-17 (đánh giá sản phẩm) và US-18 (email xác nhận mock) có trong mẫu, nhưng chưa tìm thấy phần triển khai tương ứng trong mã nguồn hiện tại.
- Lệnh khởi động backend trong Compose chạy seed; script seed xóa dữ liệu hiện có. Chỉ dùng Compose như hiện tại cho môi trường phát triển/demo, không dùng với dữ liệu production.

## Vận hành

Trước khi chạy migration, hãy sao lưu database. Xem [hướng dẫn triển khai và rollback](./deployment.md) và [ma trận truy vết](./traceability-matrix.md) để biết phạm vi triển khai, kiểm thử và các điểm chưa được xác minh.
