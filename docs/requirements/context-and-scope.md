# Task 1.1: Bối cảnh, stakeholder và phạm vi dự án BrewLite

> Tài liệu này định hình toàn bộ đồ án. Các tài liệu sau (use-case, thiết kế, báo cáo) phải bám theo phạm vi ở đây.
> Mục có dấu **[Cần xác nhận]** là chỗ nhóm cần thống nhất trước khi chốt.

## 1. Bối cảnh và vấn đề nghiệp vụ

### 1.1 Bối cảnh

Các quán đồ uống nhỏ thường nhận đơn qua điện thoại hoặc mạng xã hội. Khách muốn đặt món giao tận nơi, còn quán muốn nhận đơn gọn, thu tiền chắc chắn và biết mình còn bao nhiêu nguyên liệu.

**BrewLite** là website đặt đồ uống giao tận nơi, **thanh toán không dùng tiền mặt qua VNPay**. Hệ thống phục vụ một quán, có ba nhóm người dùng đăng nhập theo phân quyền: khách hàng (CUSTOMER), nhân viên quầy/barista (BARISTA) và quản lý cửa hàng (ADMIN).

### 1.2 Vấn đề BrewLite cần giải quyết

| # | Vấn đề hiện tại | Hệ quả | BrewLite giải quyết bằng |
|---|-----------------|--------|--------------------------|
| 1 | Nhận đơn thủ công qua tin nhắn, điện thoại | Sót đơn, nhầm size/topping | Khách tự chọn món, size, topping trên web; đơn được lưu có cấu trúc |
| 2 | Thu tiền thủ công, khó đối soát | Khách bom đơn, thất thoát | Thanh toán trước qua VNPay; đơn chỉ vào quầy khi đã thanh toán |
| 3 | Không biết tồn kho nguyên liệu, topping | Hết hàng vẫn nhận đơn | Mỗi món có công thức (Recipe); kho tự trừ theo size và topping, có giữ chỗ khi đơn chờ thanh toán |
| 4 | Quầy không có hàng đợi rõ ràng | Làm sai thứ tự, khách không biết tiến độ | Danh sách đơn theo trạng thái; khách xem được đơn của mình |
| 5 | Không có số liệu bán hàng | Khó ra quyết định | Quản lý xem sản phẩm bán chạy, tồn kho, doanh thu |
| 6 | Khuyến mãi và tích điểm làm bằng tay | Dễ lạm dụng, khó kiểm soát | Mã khuyến mãi có điều kiện và điểm thưởng được kiểm tra tự động |

### 1.3 Bối cảnh học thuật

Đồ án môn **Công nghệ phần mềm**, làm theo nhóm, quản lý mã nguồn bằng Git (mỗi chức năng một nhánh `feature/...`, commit theo dạng `feat(<mô-đun>): mô tả`, gộp qua Pull Request).

## 2. Stakeholder chính

### 2.1 Bảng stakeholder

| Stakeholder | Loại | Vai trò trong hệ thống | Tương tác chính |
|-------------|------|------------------------|-----------------|
| **Khách hàng** (CUSTOMER) | Người dùng chính | Người đặt và trả tiền | Đăng ký/đăng nhập, xem menu, giỏ hàng, đặt hàng, thanh toán, xem và hủy đơn |
| **Nhân viên quầy / Barista** (BARISTA) | Người dùng nội bộ | Chế biến và bàn giao đơn | Xem danh sách đơn, cập nhật trạng thái đơn |
| **Quản lý cửa hàng** (ADMIN) | Người dùng nội bộ | Vận hành và kiểm soát cửa hàng | Quản lý sản phẩm, kho, khuyến mãi; xem đơn và doanh thu |
| **Giảng viên / khách hàng nghiệm thu** | Bên đánh giá | Đánh giá đồ án đạt yêu cầu | Xem demo, đọc tài liệu, chấm điểm |
| **Nhóm phát triển** | Nội bộ dự án | Phân tích, thiết kế, lập trình, kiểm thử | Làm theo task, review PR, viết tài liệu |
| **Đơn vị thanh toán (VNPay)** | Hệ thống ngoài | Xử lý giao dịch trực tuyến | Nhận yêu cầu thanh toán, trả kết quả qua return URL và IPN |

### 2.2 Mục tiêu và kỳ vọng của từng stakeholder

| Stakeholder | Mục tiêu | Kỳ vọng với hệ thống |
|-------------|----------|----------------------|
| **Khách hàng** | Đặt được đồ uống đúng ý, nhanh, trả tiền an toàn | Menu dễ xem; tùy chỉnh size, topping; giá rõ ràng (tạm tính, phí giao, giảm giá, tổng); thanh toán xong biết đơn đã được nhận; xem được tiến độ và lịch sử đơn |
| **Nhân viên quầy** | Làm đúng và kịp các đơn đã thanh toán | Chỉ thấy đơn đã thanh toán; thấy rõ món, size, topping; đổi trạng thái chỉ vài thao tác; không phải xử lý đơn chưa trả tiền |
| **Quản lý cửa hàng** | Kiểm soát sản phẩm, kho, ưu đãi và doanh thu | Thêm/sửa/xóa món; nhập kho, thấy tồn kho; tạo mã khuyến mãi có giới hạn; xem báo cáo doanh thu; chỉ quản lý mới vào được khu vực quản trị |
| **Giảng viên / nghiệm thu** | Xác nhận nhóm làm đúng quy trình công nghệ phần mềm | Có phạm vi rõ ràng, tài liệu yêu cầu, use-case, thiết kế nhất quán với sản phẩm chạy được |
| **Nhóm phát triển** | Hoàn thành đúng phạm vi, đúng hạn, phối hợp ít xung đột | Phân công rõ; quy ước Git thống nhất; schema và API ổn định; tài liệu làm chuẩn chung |
| **VNPay** | Giao dịch được gửi đúng định dạng và xử lý đúng một lần | Hệ thống tạo yêu cầu đúng chữ ký, nhận IPN và return URL, xử lý kết quả an toàn, không ghi nhận trùng |

## 3. Phạm vi

### 3.1 Trong phạm vi MVP (In-scope)

MVP là phần tối thiểu để một khách đặt và trả tiền được một đơn, quầy làm được đơn đó và quản lý kiểm soát được món và kho.

| Nhóm | Chức năng MVP |
|------|---------------|
| Xác thực và phân quyền | Đăng ký, đăng nhập, đăng xuất bằng email và mật khẩu; JWT; điều hướng theo vai trò; chặn truy cập trái quyền (403) |
| Thực đơn | Xem danh sách sản phẩm; lọc theo danh mục; tìm kiếm; sắp xếp (mặc định bán chạy) |
| Chi tiết sản phẩm | Chọn size S/M/L và topping; hiển thị giá theo quy tắc nghiệp vụ |
| Giỏ hàng | Thêm, đổi số lượng, xóa món; hiển thị tạm tính, phí giao hàng, tổng tiền |
| Đặt hàng | Nhập thông tin người nhận (tên, số điện thoại, địa chỉ); xem trước đơn; tạo đơn |
| Thanh toán | Thanh toán VNPay; xử lý return URL và IPN; chống thanh toán trùng (idempotency key) |
| Đơn hàng của tôi | Xem đơn đang xử lý và lịch sử đơn; hủy đơn khi còn được phép |
| Vòng đời đơn | `PENDING` → `PAID` → `PREPARING` → `READY` → `COMPLETED`; nhánh `PAYMENT_FAILED`, `CANCELLED`; tự hủy đơn `PENDING` quá 10 phút |
| Kho | Trừ nguyên liệu theo công thức, size; trừ topping theo tồn kho; giữ chỗ khi chờ thanh toán |
| Barista | Xem danh sách đơn; cập nhật trạng thái chế biến |
| Admin | Quản lý sản phẩm (thêm, sửa, xóa); quản lý nguyên liệu, topping và nhập kho |

### 3.2 Phạm vi mở rộng (làm nếu còn thời gian)

| Chức năng | Ghi chú |
|-----------|---------|
| Mã khuyến mãi (theo %, đơn tối thiểu, thời gian hiệu lực, giới hạn lượt, mỗi tài khoản một lần) | Đã có phần backend; cần hoàn thiện giao diện và quản trị mã |
| Điểm thưởng (tích điểm, dùng điểm giảm tiền) | Phụ thuộc quy tắc quy đổi chính thức |
| Báo cáo doanh thu cho Admin | Trang doanh thu, quản lý đơn hàng cho Admin |
| Trang "Về chúng tôi" | Thông tin quán: Quận 5, TP.HCM; 7:00–22:00; hotline 0123456789; goodvibe@brewlite.com |
| Lưu giỏ hàng khi tải lại trang | Hiện giỏ lưu trong bộ nhớ trình duyệt, chưa bền vững |
| Chọn địa chỉ/khu vực giao hàng nâng cao | Hiện chỉ nhập địa chỉ dạng chữ |

**[Cần xác nhận]** Cách chia giữa MVP và mở rộng ở trên là đề xuất. Nhóm cần thống nhất lại, nhất là việc khuyến mãi và điểm thưởng thuộc MVP hay mở rộng, vì backend đã làm sẵn.

### 3.3 Ngoài phạm vi (Out-of-scope, không thực hiện)

| Nội dung | Lý do |
|----------|-------|
| Thanh toán tiền mặt (COD) và các ví khác ngoài VNPay | Thiết kế cho thanh toán không dùng tiền mặt qua một cổng |
| Ứng dụng di động (iOS/Android) | Chỉ làm web responsive |
| Theo dõi shipper thời gian thực, tích hợp đơn vị vận chuyển | Ngoài thời gian và nguồn lực đồ án |
| Đa chi nhánh, đa cửa hàng | Hệ thống phục vụ một quán |
| Đánh giá, bình luận sản phẩm | Không nằm trong yêu cầu |
| Thông báo đẩy, SMS, email giao dịch | Không nằm trong yêu cầu |
| Đa ngôn ngữ | Giao diện chỉ tiếng Việt |
| Quản lý nhân sự, chấm công, lương | Không liên quan luồng đặt đồ uống |
| Gợi ý cá nhân hóa bằng AI, phân tích nâng cao | Vượt mức yêu cầu môn học |
| Hoàn tiền tự động qua VNPay | **[Cần xác nhận]** `PaymentStatus` có `REFUNDED` nhưng chưa rõ có làm luồng hoàn tiền |

## 4. Giả định

| # | Giả định | Nếu sai thì |
|---|----------|-------------|
| A1 | Quán chỉ có một điểm bán, giao hàng trong nội thành TP.HCM | Phải thêm khu vực giao, tính phí theo khoảng cách |
| A2 | Mọi khách đặt hàng đều có tài khoản và đăng nhập | Phải thêm luồng đặt hàng cho khách vãng lai |
| A3 | VNPay dùng môi trường sandbox, không phát sinh tiền thật | Phải bổ sung hồ sơ và kiểm thử với môi trường thật |
| A4 | Công thức món và tồn kho ban đầu do Admin hoặc dữ liệu mẫu (seed) cung cấp | Kho trừ sai hoặc không trừ được |
| A5 | Giá là VND, số nguyên | Phải xử lý làm tròn |
| A6 | Mỗi đơn có một địa chỉ giao và tối đa một lần thanh toán thành công | Phải hỗ trợ chia đơn, thanh toán nhiều lần |
| A7 | Người dùng dùng trình duyệt hiện đại và có Internet ổn định | Cần thêm xử lý mất kết nối |
| A8 | Dữ liệu demo (món, ảnh, tài khoản) đủ để trình bày | Cần bổ sung dữ liệu mẫu |

## 5. Ràng buộc

### 5.1 Công nghệ

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | Next.js (App Router), React, TypeScript, TailwindCSS, Zustand |
| Backend | NestJS, TypeScript, Passport + JWT |
| Cơ sở dữ liệu | PostgreSQL qua Prisma ORM |
| Thanh toán | VNPay (sandbox) |
| Môi trường | Docker; pnpm; backend tại `localhost:3001` |
| Thiết kế | Figma (giao diện), PlantUML (use-case, sequence, activity) |

### 5.2 Nghiệp vụ

- **Giá theo size:** S = giá gốc × 0,8; M = × 1; L = × 1,2. Topping có giá riêng.
- **Tiền nước** (dùng để xét miễn phí giao hàng) gồm cả topping, tính trước khi trừ khuyến mãi.
- **Tổng đơn** = tiền nước − khuyến mãi (và điểm) + phí giao hàng. Phí giao mặc định 15.000đ.
- **Ngưỡng miễn phí giao hàng:** quy tắc nhóm là 100.000đ, nhưng `FREE_DELIVERY_THRESHOLD` trong `frontend/lib/cart-store.ts` đang là 150.000đ. **[Cần xác nhận một giá trị duy nhất.]**
- **Trừ kho** theo công thức và hệ số size; topping trừ theo tồn kho riêng.
- **Tự hủy** đơn `PENDING` quá 10 phút và trả lại phần giữ chỗ.

### 5.3 Quy trình nhóm

- Mỗi chức năng một nhánh `feature/<tên-chức-năng>`; chỉ `git add` file của chức năng đó; commit `feat(<mô-đun>): mô tả`; gộp qua Pull Request.
- Thay đổi schema đi qua migration của Prisma; không sửa tay file migration đã áp dụng.
- Giao diện phải bám thiết kế Figma (nền `#F8F5F0`, bố cục rộng 1440px).

### 5.4 Thời gian và nguồn lực

- Hạn nộp theo lịch môn học. **[Cần điền ngày cụ thể.]**
- Nhóm là sinh viên làm song song với các môn khác; một số thành viên đang học công nghệ mới, nên ưu tiên MVP trước.

### 5.5 Chất lượng

- **Bảo mật:** mật khẩu lưu dạng băm; API phân quyền theo vai trò; token vô hiệu hóa được bằng `tokenVersion`.
- **Toàn vẹn dữ liệu:** đặt hàng, trừ kho, dùng khuyến mãi, dùng điểm phải nằm trong giao dịch (transaction).
- **Giao diện:** tiếng Việt, hiển thị tốt trên máy tính và điện thoại.

## 6. Rủi ro ban đầu

| # | Rủi ro | Khả năng | Ảnh hưởng | Cách giảm thiểu |
|---|--------|----------|-----------|-----------------|
| R1 | VNPay gọi IPN về địa chỉ công khai, còn máy dev chạy `localhost` nên không nhận được kết quả | Cao | Cao | Dùng công cụ tạo đường hầm (ví dụ ngrok) khi demo; hoặc xử lý cả return URL; chuẩn bị kịch bản demo sandbox |
| R2 | Thành viên mới học công nghệ, tiến độ chậm | Cao | Trung bình | Chia task nhỏ; review PR sớm; ưu tiên MVP |
| R3 | Schema lệch giữa các thành viên (migration bị sửa, database mỗi máy một kiểu) gây lỗi chạy | Trung bình | Cao | Thống nhất người tạo migration; commit thư mục `migrations`; không sửa migration đã áp dụng; có seed chung |
| R4 | Hai người dùng cùng đặt món cuối cùng, kho trừ sai hoặc âm | Trung bình | Cao | Giữ chỗ (reserved) và trừ kho trong transaction; kiểm thử đồng thời |
| R5 | Quy tắc nghiệp vụ không thống nhất giữa frontend, backend và tài liệu (ví dụ ngưỡng miễn phí giao hàng) | Cao | Trung bình | Chốt quy tắc trong tài liệu này; backend là nguồn chuẩn, frontend chỉ hiển thị |
| R6 | Đơn chờ thanh toán chiếm kho quá lâu | Trung bình | Trung bình | Tự hủy sau 10 phút; trả lại kho và điểm |
| R7 | Thanh toán bị ghi nhận hai lần do VNPay gọi IPN lặp | Trung bình | Cao | Idempotency key; kiểm tra trạng thái trước khi cập nhật |
| R8 | Phạm vi phình to do thêm chức năng mở rộng | Trung bình | Trung bình | Chốt MVP trước; mở rộng chỉ làm khi MVP chạy ổn |
| R9 | Xung đột code khi nhiều người sửa chung file (ví dụ Header, layout) | Cao | Thấp | Một chức năng một nhánh; pull `main` thường xuyên; chia file rõ ràng |
| R10 | Sát hạn nộp, thiếu thời gian kiểm thử và demo | Trung bình | Cao | Đặt mốc nội bộ; đóng băng tính năng sớm; luyện demo trước hạn |

## 7. Điểm cần nhóm thống nhất

1. Ranh giới MVP và mở rộng (khuyến mãi, điểm thưởng, báo cáo doanh thu).
2. Ngưỡng miễn phí giao hàng: 100.000đ hay 150.000đ.
3. Có làm luồng hoàn tiền (`REFUNDED`) hay không.
4. Quy tắc chính thức cho điểm thưởng (tích bao nhiêu, quy đổi bao nhiêu).
5. Ngày nộp và các mốc kiểm tra tiến độ.