# Task 1.1 – Bối cảnh, các bên liên quan và phạm vi dự án BrewLite

## 1. Bối cảnh và vấn đề cần giải quyết

### 1.1. Bối cảnh

Hiện nay, nhiều quán đồ uống nhỏ vẫn nhận đơn qua điện thoại hoặc tin nhắn. Cách này khá thuận tiện khi ít khách, nhưng khi lượng đơn tăng thì nhân viên dễ bỏ sót đơn hoặc ghi nhầm món, size và topping. Việc theo dõi đơn đã thanh toán hay kiểm tra nguyên liệu còn lại cũng mất thời gian.

Từ những vấn đề đó, nhóm xây dựng **BrewLite**, một website đặt đồ uống giao tận nơi và thanh toán không dùng tiền mặt qua **VNPay**. Dự án tập trung vào hoạt động của một cửa hàng, với ba vai trò sử dụng hệ thống: **khách hàng (CUSTOMER)**, **nhân viên pha chế (BARISTA)** và **quản lý (ADMIN)**.

### 1.2. Những vấn đề BrewLite hướng đến

| Vấn đề | Hướng giải quyết |
|---|---|
| Đơn đặt qua tin nhắn dễ bị sót hoặc nhầm thông tin | Khách chọn món, size, topping trên website; hệ thống lưu thông tin đơn hàng. |
| Khó kiểm tra đơn đã thanh toán | Khách thanh toán qua VNPay trước khi đơn được chuyển đến quầy. |
| Không nắm rõ số lượng nguyên liệu và topping | Quản lý tồn kho theo công thức pha chế; giữ trước số lượng cần dùng khi đơn đang chờ thanh toán. |
| Nhân viên khó theo dõi tiến độ các đơn | Hiển thị danh sách đơn theo trạng thái để nhân viên cập nhật và khách hàng theo dõi. |
| Khó tổng hợp kết quả bán hàng | Hỗ trợ quản lý xem số liệu bán hàng, doanh thu và tồn kho. |
| Khuyến mãi và điểm thưởng khó quản lý thủ công | Dự kiến kiểm tra điều kiện áp dụng mã giảm giá và điểm thưởng trên hệ thống. |

### 1.3. Bối cảnh thực hiện đồ án

BrewLite là đồ án nhóm của môn **Công nghệ phần mềm**. Nhóm sử dụng Git để quản lý mã nguồn, chia công việc theo chức năng và tạo Pull Request để các thành viên kiểm tra trước khi gộp code.

## 2. Các bên liên quan (Stakeholder)

### 2.1. Danh sách stakeholder

| Bên liên quan | Vai trò | Công việc hoặc tương tác với BrewLite |
|---|---|---|
| Khách hàng (CUSTOMER) | Người đặt đồ uống | Đăng ký, đăng nhập, chọn món, đặt hàng, thanh toán, xem lịch sử và hủy đơn khi được phép. |
| Nhân viên pha chế (BARISTA) | Người xử lý đơn tại quầy | Xem các đơn đã thanh toán, chuẩn bị đồ uống và cập nhật trạng thái. |
| Quản lý cửa hàng (ADMIN) | Người quản lý hoạt động cửa hàng | Quản lý sản phẩm, nguyên liệu, topping, khuyến mãi và theo dõi doanh thu. |
| Giảng viên / người nghiệm thu | Người đánh giá đồ án | Xem tài liệu, kiểm tra sản phẩm và đánh giá kết quả thực hiện. |
| Nhóm phát triển | Người xây dựng hệ thống | Phân tích yêu cầu, thiết kế, lập trình, kiểm thử và viết báo cáo. |
| VNPay | Hệ thống thanh toán bên ngoài | Tiếp nhận giao dịch và gửi kết quả thanh toán về BrewLite. |

### 2.2. Mục tiêu và kỳ vọng

| Bên liên quan | Mục tiêu và kỳ vọng |
|---|---|
| Khách hàng | Dễ tìm đồ uống, chọn đúng size và topping, biết số tiền cần trả, thanh toán thuận tiện và theo dõi được đơn hàng. |
| Nhân viên pha chế | Nhìn rõ món cần làm, các tùy chọn của khách và cập nhật tiến độ mà không phải xử lý đơn chưa thanh toán. |
| Quản lý cửa hàng | Dễ cập nhật sản phẩm, kiểm tra nguyên liệu, theo dõi đơn và xem tình hình kinh doanh. |
| Giảng viên / người nghiệm thu | Nhóm có tài liệu rõ ràng, thực hiện đúng phạm vi và trình bày được hệ thống chạy thực tế. |
| Nhóm phát triển | Phân chia công việc hợp lý, hạn chế xung đột code và hoàn thành các chức năng đúng tiến độ. |
| VNPay | Nhận thông tin giao dịch đúng định dạng; kết quả thanh toán được hệ thống xử lý an toàn, không ghi nhận trùng. |

## 3. Phạm vi dự án

### 3.1. Chức năng chính (In-scope / MVP)

Nhóm ưu tiên hoàn thiện luồng từ lúc khách chọn đồ uống đến khi thanh toán và nhận được đơn. Bên cạnh đó, nhân viên cần xử lý được đơn và quản lý cần cập nhật được sản phẩm, kho.

| Nhóm chức năng | Nội dung thực hiện |
|---|---|
| Tài khoản và phân quyền | Đăng ký, đăng nhập, đăng xuất bằng email và mật khẩu; sử dụng JWT; giới hạn quyền truy cập theo vai trò. |
| Thực đơn | Hiển thị sản phẩm, tìm kiếm, lọc theo danh mục và sắp xếp danh sách. |
| Chi tiết đồ uống | Chọn size S/M/L, topping và xem giá tương ứng. |
| Giỏ hàng | Thêm món đã tùy chỉnh, thay đổi số lượng, xóa món và xem số tiền tạm tính, phí giao hàng, tổng tiền. |
| Đặt hàng | Nhập tên, số điện thoại, địa chỉ nhận hàng; kiểm tra thông tin và tạo đơn. |
| Thanh toán | Thanh toán bằng VNPay; nhận kết quả qua return URL và IPN; tránh ghi nhận thanh toán nhiều lần. |
| Đơn hàng | Xem đơn hiện tại, lịch sử đặt hàng và hủy đơn nếu còn đủ điều kiện. |
| Trạng thái đơn | `PENDING` → `PAID` → `PREPARING` → `READY` → `COMPLETED`; có trạng thái `PAYMENT_FAILED`, `CANCELLED`. Đơn `PENDING` quá 10 phút sẽ được tự hủy. |
| Kho nguyên liệu | Quản lý nguyên liệu theo công thức, size và topping; giữ trước lượng nguyên liệu cho đơn chờ thanh toán. |
| Nhân viên pha chế | Xem đơn và cập nhật trạng thái chế biến. |
| Quản lý cửa hàng | Thêm, sửa, xóa sản phẩm; quản lý nguyên liệu, topping và nhập kho. |

### 3.2. Chức năng mở rộng

Đây là những chức năng nhóm dự kiến làm thêm sau khi các chức năng chính hoạt động ổn định.

| Chức năng | Ghi chú |
|---|---|
| Mã khuyến mãi | Áp dụng theo phần trăm, giá trị đơn tối thiểu, thời gian và số lượt sử dụng. Backend đã có một phần; giao diện cần hoàn thiện. |
| Điểm thưởng | Tích điểm và sử dụng điểm để giảm tiền; cần thống nhất cách quy đổi. |
| Báo cáo doanh thu | Thống kê doanh thu và hỗ trợ quản lý theo dõi đơn hàng. |
| Trang Về chúng tôi | Giới thiệu cửa hàng tại Quận 5, TP.HCM; giờ hoạt động 7:00–22:00; số điện thoại 0123456789; email goodvibe@brewlite.com. |
| Lưu giỏ hàng | Giữ thông tin giỏ hàng khi người dùng tải lại trang; cần kiểm tra và hoàn thiện khả năng lưu trữ. |
| Địa chỉ giao hàng nâng cao | Bổ sung lựa chọn khu vực giao hàng thay vì chỉ nhập địa chỉ bằng chữ. |

**Cần nhóm xác nhận:** Mã khuyến mãi, điểm thưởng và báo cáo doanh thu sẽ thuộc MVP hay phần mở rộng. Phần backend của một số chức năng đã được triển khai.

### 3.3. Những nội dung không thực hiện (Out-of-scope)

| Nội dung | Lý do |
|---|---|
| Thanh toán tiền mặt (COD) hoặc cổng thanh toán khác | Dự án tập trung vào VNPay. |
| Ứng dụng riêng cho Android và iOS | Nhóm chỉ xây dựng website có thể dùng trên điện thoại. |
| Theo dõi vị trí người giao hàng trực tiếp | Chưa nằm trong phạm vi và thời gian của đồ án. |
| Quản lý nhiều chi nhánh | BrewLite được xây dựng cho một cửa hàng. |
| Đánh giá và bình luận sản phẩm | Không thuộc các chức năng ưu tiên. |
| Gửi thông báo qua SMS, email hoặc thông báo đẩy | Chưa triển khai trong phạm vi này. |
| Hỗ trợ nhiều ngôn ngữ | Giao diện sử dụng tiếng Việt. |
| Quản lý nhân sự, chấm công và tiền lương | Không phục vụ trực tiếp quy trình đặt đồ uống. |
| Gợi ý sản phẩm bằng AI, phân tích dữ liệu nâng cao | Vượt quá phạm vi hiện tại. |
| Hoàn tiền tự động qua VNPay | Chưa chốt có triển khai hay không, dù hệ thống có trạng thái `REFUNDED`. |

## 4. Giả định ban đầu

Các giả định dưới đây được dùng khi thiết kế hệ thống. Nếu có thay đổi, nhóm cần xem lại những chức năng liên quan.

| Mã | Giả định |
|---|---|
| A1 | Cửa hàng chỉ có một địa điểm bán và phục vụ giao hàng trong nội thành TP.HCM. |
| A2 | Khách cần có tài khoản và đăng nhập trước khi đặt hàng. |
| A3 | VNPay được sử dụng ở môi trường thử nghiệm (sandbox), không giao dịch bằng tiền thật. |
| A4 | Công thức pha chế và số lượng nguyên liệu ban đầu được quản lý nhập hoặc lấy từ dữ liệu mẫu. |
| A5 | Giá sản phẩm tính bằng VND và lưu dưới dạng số nguyên. |
| A6 | Mỗi đơn có một địa chỉ nhận hàng và tối đa một lần thanh toán thành công. |
| A7 | Người dùng có kết nối Internet và sử dụng trình duyệt tương đối mới. |
| A8 | Nhóm chuẩn bị đủ dữ liệu mẫu về món, hình ảnh và tài khoản để kiểm thử, demo. |

Nếu các giả định về khu vực giao hàng, tài khoản hoặc thanh toán thay đổi, nhóm sẽ cần bổ sung luồng xử lý tương ứng.

## 5. Ràng buộc của dự án

### 5.1. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, Zustand |
| Backend | NestJS, TypeScript, Passport, JWT |
| Cơ sở dữ liệu | PostgreSQL, Prisma ORM |
| Thanh toán | VNPay sandbox |
| Môi trường phát triển | Docker, pnpm; backend chạy tại `localhost:3001` |
| Thiết kế và sơ đồ | Figma, PlantUML |

### 5.2. Quy tắc nghiệp vụ

- Giá size S bằng 80% giá gốc, M bằng giá gốc và L bằng 120% giá gốc. Topping được cộng thêm theo giá riêng.
- Tiền nước gồm giá đồ uống và topping, được tính trước khi trừ khuyến mãi.
- Tổng tiền đơn hàng = tiền nước − khuyến mãi − điểm quy đổi (nếu có) + phí giao hàng.
- Phí giao hàng mặc định là **15.000đ**. Nhóm đang có hai mức miễn phí giao hàng: **100.000đ** theo quy tắc đã trao đổi và **150.000đ** trong `frontend/lib/cart-store.ts`.
- Nguyên liệu được tính theo công thức và size; topping có số lượng tồn riêng.
- Đơn `PENDING` quá 10 phút sẽ tự hủy và hoàn lại phần nguyên liệu, điểm đã giữ trước.

### 5.3. Quy trình làm việc nhóm

- Mỗi chức năng hoặc lần sửa lỗi được thực hiện trên một nhánh Git riêng, ví dụ `feature/...` hoặc `fix/...`.
- Sau khi làm xong, thành viên kiểm tra lại, commit, push và tạo Pull Request để nhóm review trước khi merge.
- Khi thay đổi cấu trúc cơ sở dữ liệu, sử dụng Prisma migration và không tự sửa migration đã áp dụng.
- Giao diện bám theo thiết kế Figma, với màu nền `#F8F5F0` và bố cục thiết kế rộng 1440px.

### 5.4. Thời gian và nhân lực

Dự án do nhóm sinh viên thực hiện trong thời gian học môn Công nghệ phần mềm. Các thành viên còn phải học những môn khác nên nhóm sẽ ưu tiên hoàn thành chức năng chính trước, sau đó mới làm phần mở rộng.


### 5.5. Yêu cầu chất lượng

- Mật khẩu được lưu dưới dạng băm; API kiểm tra quyền truy cập theo vai trò. Hệ thống có cơ chế `tokenVersion` để vô hiệu hóa token.
- Các thao tác đặt hàng, trừ kho, dùng khuyến mãi và điểm thưởng cần được xử lý nhất quán bằng transaction.
- Website sử dụng tiếng Việt và hiển thị phù hợp trên máy tính, điện thoại.

## 6. Rủi ro có thể gặp

| Rủi ro | Mức ảnh hưởng dự kiến | Cách xử lý dự kiến |
|---|---|---|
| VNPay không gửi được IPN về máy chạy `localhost` | Cao | Chuẩn bị môi trường demo sandbox và công cụ như ngrok để nhận callback. |
| Một số thành viên chưa quen công nghệ sử dụng | Trung bình | Chia nhỏ công việc, hỗ trợ nhau và review code sớm. |
| Cơ sở dữ liệu giữa các máy không đồng nhất | Cao | Dùng chung migration và dữ liệu mẫu; không sửa migration đã chạy. |
| Nhiều khách cùng đặt món gần hết nguyên liệu | Cao | Kiểm tra tồn kho, giữ trước nguyên liệu và xử lý trong transaction. |
| Frontend và backend áp dụng quy tắc khác nhau | Trung bình | Thống nhất quy tắc, đặc biệt là mức miễn phí giao hàng. |
| Đơn chờ thanh toán giữ nguyên liệu quá lâu | Trung bình | Tự hủy đơn sau 10 phút và hoàn lại lượng đã giữ. |
| VNPay gửi thông báo thanh toán lặp | Cao | Kiểm tra trạng thái giao dịch và dùng cơ chế chống xử lý trùng. |
| Thêm quá nhiều chức năng ngoài kế hoạch | Trung bình | Hoàn thiện MVP trước khi nhận thêm chức năng. |
| Thành viên sửa cùng một file gây xung đột | Trung bình | Làm việc trên nhánh riêng, cập nhật nhánh chính thường xuyên và review PR. |
| Thiếu thời gian kiểm thử trước ngày nộp | Cao | Chốt chức năng sớm và dành thời gian kiểm thử, chạy thử demo. |

