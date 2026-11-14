# Sprint Retrospective — BrewLite

Tổng hợp dưới đây theo mục 8.1–8.2 của [mẫu Assignment SGU](../Assigment_template_SGU.pdf). Đây là nội dung retrospective được ghi trong mẫu báo cáo, không phải kết quả phỏng vấn lại từng thành viên.

## Tiến độ theo Sprint

| Giai đoạn | Thời gian theo mẫu | Trọng tâm |
|---|---|---|
| Sprint 1 | 04/10–13/10/2026 | Khởi tạo dự án, cấu trúc, API sản phẩm và Menu |
| Sprint 2 | 14/10–23/10/2026 | Chi tiết món, giỏ hàng, đơn hàng và xác thực |
| Sprint 3 | 24/10–02/11/2026 | Thanh toán, xác nhận và lịch sử đơn |
| Sprint 4 | 03/11–12/11/2026 | Admin, Barista và Loyalty |
| Tổng kết | 13/11–15/11/2026 | Demo, retrospective và UAT |

## Nhìn lại từng Sprint

| Sprint | Làm tốt | Cần cải thiện | Hành động |
|---|---|---|---|
| 1 | Hoàn thành monorepo, Docker Compose và thống nhất API để Frontend/Backend có thể làm song song. | Chưa thống nhất đầy đủ các trường schema; quy ước commit chưa được tuân thủ đều. | Chốt Prisma schema và seed từ Sprint Planning; dùng Swagger làm tài liệu chung; Backend bàn giao API hoặc dữ liệu giả sớm cho Frontend. |
| 2 | Hoàn thành JWT, giỏ hàng và API tạo đơn; Daily Scrum giúp phát hiện sớm việc bị chặn. | Frontend có lúc phải chờ token/API từ Backend; code review còn chậm. | Chia nhỏ hạng mục ngay từ Planning; phối hợp kiểm tra luồng thanh toán end-to-end giữa Frontend và Backend. |
| 3 | Hoàn thành tích hợp VNPay sandbox, state machine, idempotency và kiểm thử các yêu cầu chính. | Task 10 có phạm vi lớn, dồn về cuối Sprint; việc nối Frontend với `POST /payments` cần phối hợp chặt hơn. | Dành thời gian cuối kỳ rà soát tài liệu, kiểm thử và README trước khi bàn giao. |
| 4 | Bổ sung các chức năng mở rộng Admin và Barista trên nền tảng sẵn có. | Thời gian kiểm thử phần mở rộng hạn chế; một số tài liệu và test cập nhật chưa kịp. | Chốt checklist phát hành, kiểm tra lại tài liệu/test và xác nhận các kịch bản UAT trước nghiệm thu. |

## Theo dõi sau Sprint

| Ưu tiên | Việc cần làm | Cách xác nhận |
|---|---|---|
| Cao | Kiểm tra cấu hình triển khai và rollback; không chạy seed trên database có dữ liệu cần giữ. | Thành viên khác làm thử quy trình backup/restore trên môi trường demo sạch. |
| Cao | Đối chiếu kết quả kiểm thử trong báo cáo với test chạy được trong repository. | Lưu lệnh chạy, kết quả và phân biệt test backend với kiểm thử UI thủ công. |
| Vừa | Bổ sung kiểm thử tự động cho các luồng Frontend quan trọng. | Test menu, auth, giỏ hàng, checkout và kết quả thanh toán chạy được trong CI. |
| Vừa | Xác nhận phạm vi tiếp theo cho đánh giá sản phẩm và email xác nhận mock. | Cập nhật backlog và ma trận truy vết khi có triển khai. |
