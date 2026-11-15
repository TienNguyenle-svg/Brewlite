# Mô tả Use-case "Đặt hàng và thanh toán" (Task 1.3)

> Bám theo sơ đồ use-case "Đặt hàng và Thanh toán" của nhóm, `context-and-scope.md` (Task 1.1) và `srs.md` (Task 1.2).
> Mục có dấu **[Cần xác nhận]** là chỗ nhóm cần thống nhất trước khi chốt.

## 1. Tổng quan

### 1.1 Phạm vi use-case

Use-case mô tả toàn bộ luồng từ lúc khách chọn món đến lúc đơn được thanh toán thành công qua VNPay, cùng các nhánh rẽ (mã giảm giá, điểm thưởng, thanh toán lại, hủy đơn) và các tình huống lỗi.

### 1.2 Các use-case trong sơ đồ và cách mô tả

| Gói trong sơ đồ | Use-case | Vai trò trong tài liệu này |
|-----------------|----------|----------------------------|
| (ngoài gói) | Đăng nhập | Được **include** bởi "Đặt hàng"; mô tả ở bước 3 và luồng A4 |
| Đặt hàng | Chọn món, size và topping | Bước 1 của luồng chính |
| Đặt hàng | **Đặt hàng** | **Use-case chính (phần 1 của UC-01)** |
| Đặt hàng | Áp dụng mã giảm giá | **Extend** "Đặt hàng"; luồng A1 |
| Đặt hàng | Sử dụng điểm thưởng | **Extend** "Đặt hàng"; luồng A2 |
| Đặt hàng | Xem lịch sử đơn hàng | Dùng sau khi đặt để xem trạng thái đơn; xem mục 6 |
| Thanh toán | **Thanh toán qua VNPay** | **Use-case chính (phần 2 của UC-01)** |
| Thanh toán | Thanh toán lại | **Extend** "Thanh toán qua VNPay"; luồng A3 |
| Thanh toán | Xác nhận kết quả thanh toán | Do Hệ thống thanh toán (VNPay) kích hoạt; bước 10, 11 |
| Hủy đơn hàng | Hủy đơn chưa thanh toán | Luồng A5 |
| Hủy đơn hàng | Hủy đơn đã thanh toán | Luồng A6 |
| Hủy đơn hàng | Hủy đơn quá hạn | Luồng E10 (hệ thống tự thực hiện) |

### 1.3 Mô tả chi tiết tác nhân (Actors)

Sơ đồ có 2 tác nhân vẽ ra (Khách hàng, Hệ thống thanh toán). Tài liệu bổ sung thêm 2 tác nhân ngầm (Barista, Hệ thống tự động) vì họ ảnh hưởng đến kết quả của use-case.

| Tác nhân | Loại | Có trên sơ đồ | Use-case tương tác |
|----------|------|---------------|--------------------|
| Khách hàng | Chính, con người | Có | Đăng nhập, Chọn món size và topping, Đặt hàng, Áp dụng mã giảm giá, Sử dụng điểm thưởng, Xem lịch sử đơn hàng, Thanh toán qua VNPay, Thanh toán lại, các use-case Hủy đơn (chưa thanh toán, đã thanh toán) |
| Hệ thống thanh toán (VNPay) | Phụ, hệ thống ngoài | Có | Thanh toán qua VNPay, Xác nhận kết quả thanh toán |
| Barista | Gián tiếp, con người | Không | Nhận đơn sau khi đơn `PAID` (kết quả của UC-01) |
| Hệ thống tự động (tác vụ định kỳ) | Gián tiếp, hệ thống nội bộ | Không | Hủy đơn quá hạn |

#### Tác nhân 1: Khách hàng (CUSTOMER)

| Mục | Nội dung |
|-----|----------|
| **Mô tả** | Người dùng cuối của quán, đặt đồ uống giao tận nơi qua website BrewLite. Đây là người khởi động và hoàn tất use-case. |
| **Vai trò trong hệ thống** | `CUSTOMER`, vai trò mặc định khi đăng ký. Một tài khoản có email, mật khẩu (lưu dạng băm), số điểm thưởng hiện có, số điểm đang giữ chỗ. |
| **Mục tiêu** | Đặt được đồ uống đúng ý (món, size, topping), biết rõ tổng tiền, thanh toán an toàn, theo dõi và hủy đơn khi cần, tận dụng khuyến mãi và điểm thưởng. |
| **Trạng thái khi tương tác** | Chưa đăng nhập: chỉ xem menu, chi tiết món; muốn đặt hàng phải đăng nhập (include "Đăng nhập").<br>Đã đăng nhập: dùng đầy đủ giỏ hàng, đặt đơn, thanh toán, xem và hủy đơn của mình. |
| **Quyền hạn** | Chỉ truy cập đơn, thanh toán, điểm thưởng của chính mình. Không truy cập được khu vực Barista và Admin (nhận 403). |
| **Thông tin khách cung cấp** | Email, mật khẩu; món, size, topping, số lượng; mã giảm giá; số điểm muốn dùng; họ tên, số điện thoại, địa chỉ người nhận; thông tin thẻ/ngân hàng (nhập trên VNPay, BrewLite không nhận). |
| **Thông tin khách nhận** | Giá theo size, tạm tính, phí giao, giảm giá, tổng tiền; mã đơn; kết quả thanh toán; trạng thái đơn; số điểm thưởng. |
| **Đặc điểm sử dụng** | Dùng cả máy tính và điện thoại; không cần kiến thức kỹ thuật; kỳ vọng thao tác ngắn, thông báo lỗi dễ hiểu bằng tiếng Việt. |
| **Giả định** | Có tài khoản và kết nối Internet ổn định; có phương thức thanh toán điện tử do VNPay hỗ trợ. |
| **Liên kết trên sơ đồ** | Association với Đăng nhập, Chọn món size và topping, Xem lịch sử đơn hàng, Đặt hàng, Thanh toán lại, Thanh toán qua VNPay, Hủy đơn chưa thanh toán, Hủy đơn đã thanh toán. |

#### Tác nhân 2: Hệ thống thanh toán (VNPay)

| Mục | Nội dung |
|-----|----------|
| **Mô tả** | Cổng thanh toán trực tuyến bên ngoài, xử lý giao dịch giữa khách hàng và ngân hàng. Dự án dùng môi trường thử nghiệm (sandbox), không phát sinh tiền thật. |
| **Vai trò trong hệ thống** | Tác nhân phụ: không khởi động use-case mà tham gia ở bước thanh toán và thông báo kết quả. |
| **Mục tiêu** | Nhận yêu cầu thanh toán đúng định dạng và chữ ký, xử lý giao dịch một lần, trả kết quả chính xác về BrewLite. |
| **Cách giao tiếp** | **Từ BrewLite sang VNPay:** URL thanh toán có số tiền, mã tham chiếu đơn, thời hạn và chữ ký.<br>**Từ VNPay về BrewLite:** (1) IPN, gọi trực tiếp từ máy chủ VNPay tới `GET /payments/vnpay-ipn`, là căn cứ chính để đổi trạng thái; (2) return URL, trình duyệt khách được chuyển về `GET /payments/vnpay-return` để hiển thị kết quả. |
| **Thông tin VNPay gửi** | Mã giao dịch, số tiền, mã phản hồi (thành công hay lỗi), thời gian, chữ ký. |
| **Ràng buộc** | Mọi dữ liệu từ VNPay phải được kiểm tra chữ ký và đối chiếu số tiền trước khi xử lý; có thể gửi IPN lặp lại nên hệ thống phải chịu được (idempotent); IPN cần địa chỉ công khai nên máy chạy `localhost` có thể không nhận được. |
| **Giả định** | Dịch vụ VNPay sandbox hoạt động; cấu hình (mã đối tác, khóa bí mật, URL) đúng và đọc từ biến môi trường. |
| **Liên kết trên sơ đồ** | Association với Thanh toán qua VNPay và Xác nhận kết quả thanh toán. |

#### Tác nhân 3: Barista (gián tiếp, không vẽ trên sơ đồ)

| Mục | Nội dung |
|-----|----------|
| **Mô tả** | Nhân viên quầy chế biến đồ uống. Không tham gia trực tiếp UC-01 nhưng nhận kết quả của nó. |
| **Vai trò trong hệ thống** | `BARISTA`. |
| **Liên quan đến use-case** | Chỉ nhìn thấy đơn sau khi đơn chuyển `PAID` (POST-S5); đơn `PENDING`, `PAYMENT_FAILED`, `CANCELLED` không xuất hiện trong danh sách cần làm. Việc Barista chuyển đơn sang `PREPARING` cũng quyết định khách còn hủy đơn đã thanh toán được hay không (A6). |
| **Use-case riêng** | Cập nhật trạng thái đơn (`PAID` → `PREPARING` → `READY` → `COMPLETED`), mô tả ở tài liệu khác. |

#### Tác nhân 4: Hệ thống tự động (tác vụ định kỳ, không vẽ trên sơ đồ)

| Mục | Nội dung |
|-----|----------|
| **Mô tả** | Tác vụ chạy nền theo lịch của backend (cron), không có người điều khiển. |
| **Nhiệm vụ trong use-case** | Tìm đơn `PENDING` đã quá 10 phút chưa thanh toán, chuyển sang `CANCELLED`, trả lại phần giữ chỗ kho và điểm (use-case Hủy đơn quá hạn, luồng E10). |
| **Tần suất** | Chạy định kỳ (khoảng mỗi phút); một lần chạy lỗi không được làm dừng các lần sau. |
| **Gợi ý cho sơ đồ** | Thêm tác nhân "Hệ thống" nối với "Hủy đơn quá hạn", hoặc ghi chú use-case do hệ thống tự kích hoạt. |

## 2. Đặc tả UC-01: Đặt hàng và thanh toán

| Mục | Nội dung |
|-----|----------|
| **Mã use-case** | UC-01 |
| **Tên** | Đặt hàng và thanh toán |
| **Mô tả ngắn** | Khách hàng chọn đồ uống, tạo đơn và thanh toán trực tuyến qua VNPay. Khi thanh toán thành công, đơn được chuyển cho quầy chế biến. |
| **Tác nhân chính** | Khách hàng (vai trò CUSTOMER) |
| **Tác nhân phụ** | Hệ thống thanh toán (VNPay) |
| **Tác nhân gián tiếp** | Barista (nhận đơn sau khi đơn `PAID`); Hệ thống (tác vụ định kỳ tự hủy đơn quá hạn) |
| **Mức độ** | Mục tiêu người dùng (user goal) |
| **Ưu tiên** | Must (MVP) |
| **Tần suất** | Rất cao, là chức năng tạo doanh thu chính |
| **Yêu cầu liên quan** | FR-02, FR-09 đến FR-14, FR-17 đến FR-30, FR-36, NFR-04 đến NFR-11 |

### 2.1 Trigger (sự kiện kích hoạt)

Khách hàng bấm **"Đặt hàng"** (hoặc "Thanh toán") ở trang giỏ hàng sau khi đã có ít nhất một món trong giỏ.

### 2.2 Tiền điều kiện

| # | Tiền điều kiện |
|---|----------------|
| PRE-1 | Khách hàng đã đăng nhập bằng tài khoản vai trò CUSTOMER (nếu chưa, luồng A4 xử lý). |
| PRE-2 | Giỏ hàng có ít nhất một món. |
| PRE-3 | Các món trong giỏ còn bán, và còn đủ nguyên liệu, topping khả dụng (tồn kho trừ phần giữ chỗ). |
| PRE-4 | Backend, cơ sở dữ liệu hoạt động; cấu hình VNPay hợp lệ. |

### 2.3 Hậu điều kiện

**Thành công (đơn được thanh toán):**

| # | Hậu điều kiện |
|---|---------------|
| POST-S1 | Đơn có trạng thái `PAID`; bản ghi thanh toán có trạng thái `SUCCEEDED`, số tiền bằng tổng đơn. |
| POST-S2 | Tồn kho nguyên liệu và topping bị trừ đúng theo công thức, size, số lượng; phần giữ chỗ được giải phóng. |
| POST-S3 | Nếu dùng mã giảm giá, một bản ghi lượt dùng mã được ghi nhận; nếu dùng điểm, điểm được trừ; điểm thưởng của đơn được cộng theo quy tắc. **[Cần xác nhận thời điểm cộng điểm]** |
| POST-S4 | Giỏ hàng của khách được xóa. |
| POST-S5 | Đơn xuất hiện trong danh sách của Barista và trong "Đơn hàng của tôi" của khách. |

**Thất bại (đơn chưa được thanh toán):**

| # | Hậu điều kiện |
|---|---------------|
| POST-F1 | Không có khoản tiền nào bị ghi nhận thành công; tồn kho thực tế không đổi. |
| POST-F2 | Đơn ở trạng thái `PENDING` (còn hạn, có thể thanh toán lại), `PAYMENT_FAILED`, hoặc `CANCELLED`. |
| POST-F3 | Với đơn `CANCELLED`, toàn bộ phần giữ chỗ kho và điểm được trả lại. |

### 2.4 Luồng chính (Main flow)

| Bước | Tác nhân | Hành động |
|------|----------|-----------|
| 1 | Khách hàng | Chọn món, size (S/M/L) và topping ở trang chi tiết sản phẩm, rồi thêm vào giỏ (use-case "Chọn món, size và topping"). |
| 2 | Hệ thống | Cập nhật giỏ hàng: giá theo size (BR-01), giá topping, tạm tính; cập nhật số lượng ở Header. |
| 3 | Khách hàng | Mở giỏ hàng, kiểm tra món và số lượng, bấm "Đặt hàng". |
| 4 | Hệ thống | Kiểm tra đăng nhập (**include** "Đăng nhập"); đã đăng nhập thì gọi xem trước đơn và hiển thị tạm tính, phí giao hàng, giảm giá, tổng tiền (BR-02 đến BR-04). |
| 5 | Khách hàng | Nhập thông tin người nhận: họ tên, số điện thoại, địa chỉ giao hàng. |
| 6 | Khách hàng | Xác nhận đặt đơn. |
| 7 | Hệ thống | Kiểm tra dữ liệu; tính lại giá ở backend (không tin giá từ giao diện); kiểm tra tồn kho khả dụng; **trong một giao dịch** tạo đơn trạng thái `PENDING` và giữ chỗ nguyên liệu, topping (và điểm nếu dùng). |
| 8 | Hệ thống | Tạo bản ghi thanh toán trạng thái `PENDING` (có khóa idempotency, thời hạn 10 phút), sinh URL VNPay có chữ ký, chuyển khách sang trang VNPay (use-case "Thanh toán qua VNPay"). |
| 9 | Khách hàng | Thanh toán trên VNPay (chọn ngân hàng/thẻ, nhập thông tin, xác thực OTP). |
| 10 | Hệ thống thanh toán (VNPay) | Gửi thông báo kết quả (IPN) về hệ thống. Hệ thống kiểm tra chữ ký và số tiền; nếu hợp lệ và thành công thì cập nhật thanh toán `SUCCEEDED`, đơn `PAID`, trừ kho, ghi lượt dùng mã nếu có (use-case "Xác nhận kết quả thanh toán"). |
| 11 | Hệ thống | VNPay chuyển khách về trang kết quả (return URL); hệ thống hiển thị "Thanh toán thành công" kèm mã đơn và xóa giỏ hàng. |
| 12 | Hệ thống | Đơn `PAID` xuất hiện trong danh sách của Barista để chế biến. |

Ghi chú: bước 10 và 11 có thể xảy ra theo thứ tự bất kỳ. Thông báo IPN là căn cứ chính để đổi trạng thái đơn.

### 2.5 Luồng thay thế (Alternative flows)

| Mã | Điểm rẽ nhánh | Điều kiện | Diễn biến | Kết quả |
|----|---------------|-----------|-----------|---------|
| **A1** Áp dụng mã giảm giá (extend) | Sau bước 4 | Khách nhập mã giảm giá | 1. Khách nhập mã và bấm áp dụng.<br>2. Hệ thống kiểm tra mã: tồn tại, đang hoạt động, trong thời gian hiệu lực, đạt đơn tối thiểu, còn lượt, tài khoản chưa dùng (BR-06).<br>3. Hợp lệ thì hiển thị số tiền giảm và cập nhật tổng tiền.<br>4. Khách có thể gỡ mã bất cứ lúc nào. | Quay lại bước 5 với tổng tiền mới. Mã không hợp lệ xem E7. |
| **A2** Sử dụng điểm thưởng (extend) | Sau bước 4 | Khách có điểm và muốn dùng | 1. Khách nhập số điểm muốn dùng.<br>2. Hệ thống kiểm tra không vượt số điểm hiện có.<br>3. Cập nhật tiền giảm từ điểm và tổng tiền.<br>4. Khi tạo đơn (bước 7), số điểm được giữ chỗ. | Quay lại bước 5. Vượt số điểm xem E8. |
| **A3** Thanh toán lại (extend) | Sau bước 9 hoặc khi mở lại đơn | Thanh toán lần trước không hoàn tất (khách thoát, hủy, thất bại) và đơn còn trong hạn 10 phút | 1. Khách mở "Đơn hàng của tôi", chọn đơn còn hạn, bấm "Thanh toán lại".<br>2. Hệ thống tạo bản ghi thanh toán mới (khóa idempotency mới) cho đúng đơn đó, không tạo đơn mới.<br>3. Chuyển sang VNPay, tiếp tục từ bước 9. | Thành công thì kết thúc như luồng chính. |
| **A4** Chưa đăng nhập (include "Đăng nhập") | Bước 4 | Khách chưa đăng nhập hoặc phiên hết hạn | 1. Hệ thống chuyển sang trang đăng nhập.<br>2. Khách đăng nhập (hoặc đăng ký rồi đăng nhập).<br>3. Hệ thống đưa khách về giỏ hàng, giữ nguyên các món đã chọn. | Tiếp tục từ bước 4. |
| **A5** Hủy đơn chưa thanh toán | Sau bước 8, trước khi thanh toán thành công | Đơn `PENDING`; khách chủ động hủy | 1. Khách bấm hủy đơn.<br>2. Hệ thống đổi đơn sang `CANCELLED`, hủy thanh toán đang chờ, trả lại phần giữ chỗ kho và điểm. | Use-case kết thúc thất bại có kiểm soát (POST-F3). |
| **A6** Hủy đơn đã thanh toán | Sau bước 10 | Đơn `PAID` nhưng Barista chưa chuyển sang `PREPARING`. **[Cần xác nhận]** | 1. Khách bấm hủy đơn.<br>2. Hệ thống kiểm tra trạng thái cho phép hủy.<br>3. Đổi đơn sang `CANCELLED`, trả lại kho và điểm.<br>4. Xử lý tiền đã thu theo quy định của nhóm. **[Cần xác nhận: hoàn tiền thủ công hay tự động]** | Xem lưu ý ở mục 7. |
| **A7** Đổi giỏ khi xem trước | Bước 4 | Khách đổi số lượng hoặc xóa món | Hệ thống tính lại tạm tính, phí giao, tổng; nếu tạm tính xuống dưới mức tối thiểu của mã đang áp thì tự gỡ mã. | Quay lại bước 4. |
| **A8** Miễn phí giao hàng | Bước 4 | Tiền nước đạt ngưỡng miễn phí (BR-04) | Hệ thống hiển thị phí giao là 0đ. | Tiếp tục bình thường. |

### 2.6 Luồng ngoại lệ (Exception flows)

| Mã | Điểm xảy ra | Điều kiện lỗi | Hệ thống xử lý | Kết quả cho khách |
|----|-------------|----------------|----------------|-------------------|
| **E1** | Mọi bước gọi API | Backend không phản hồi hoặc mất kết nối | Hiển thị thông báo "Không thể kết nối máy chủ", không mất giỏ hàng, không tạo đơn dở dang. | Thử lại khi có kết nối. |
| **E2** | Bước 4 đến 8 | Token hết hạn hoặc không hợp lệ (401) | Chuyển sang đăng nhập, giữ giỏ, quay lại bước 4 sau khi đăng nhập. | Đăng nhập lại và tiếp tục. |
| **E3** | Bước 3 | Giỏ hàng trống | Vô hiệu hóa nút đặt hàng, hiển thị "Giỏ hàng trống". | Quay lại menu chọn món. |
| **E4** | Bước 5, 6 | Thiếu họ tên, số điện thoại hoặc địa chỉ; số điện thoại sai định dạng | Không tạo đơn, hiển thị lỗi cạnh từng trường. | Sửa thông tin rồi gửi lại. |
| **E5** | Bước 4, 7 | Món bị xóa, ngừng bán hoặc đổi giá kể từ lúc thêm vào giỏ | Từ chối tạo đơn, báo rõ món nào thay đổi, làm mới giá theo dữ liệu hiện tại. | Xem lại giỏ rồi đặt lại. |
| **E6** | Bước 7 | Nguyên liệu hoặc topping không đủ tồn khả dụng | Không tạo đơn, không giữ chỗ gì, báo món hoặc topping nào đang hết. | Bỏ món hoặc đổi món khác. |
| **E7** | A1 | Mã không tồn tại, đã tắt, chưa tới hoặc quá hạn, chưa đạt đơn tối thiểu, hết lượt, tài khoản đã dùng | Không giảm giá, hiển thị lý do cụ thể. | Có thể nhập mã khác hoặc đặt đơn không mã. |
| **E8** | A2 | Số điểm dùng vượt số điểm hiện có | Từ chối, hiển thị số điểm tối đa dùng được. | Nhập lại số điểm hợp lệ. |
| **E9** | Bước 9, 10 | Thanh toán thất bại hoặc khách hủy ngay trên VNPay | Thanh toán `FAILED`, đơn `PAYMENT_FAILED`; trang kết quả báo thất bại. Phần giữ chỗ vẫn được giữ đến hết hạn hoặc khi hủy. | Chọn thanh toán lại (A3) nếu còn hạn, hoặc hủy đơn. |
| **E10** | Sau bước 8 | Quá 10 phút chưa thanh toán thành công (**Hủy đơn quá hạn**) | Tác vụ định kỳ chuyển đơn `PENDING` sang `CANCELLED`, trả lại giữ chỗ kho và điểm. Nếu khách mở lại đơn, báo "đơn đã hết hạn". | Đặt đơn mới từ giỏ hàng. |
| **E11** | Bước 10, 11 | Chữ ký VNPay sai hoặc số tiền khác tổng đơn | Từ chối, **không** đổi trạng thái đơn hay thanh toán, ghi log. | Không có thay đổi; khách liên hệ cửa hàng nếu đã bị trừ tiền. |
| **E12** | Bước 10 | VNPay gửi IPN lặp lại cho cùng giao dịch | Nhận biết nhờ khóa idempotency và trạng thái hiện tại; không trừ kho, không ghi lượt dùng mã, không cộng điểm lần hai. | Dữ liệu không đổi. |
| **E13** | Bước 10, 11 | IPN chưa tới khi khách đã quay về (ví dụ môi trường chạy `localhost`) | Trang kết quả hiển thị "Đang xác nhận thanh toán"; đơn giữ `PENDING` cho tới khi IPN tới hoặc hết hạn. **[Cần xác nhận cách xử lý khi demo]** | Khách xem lại trạng thái ở "Đơn hàng của tôi". |
| **E14** | Bước 7 | Lỗi cơ sở dữ liệu giữa chừng khi tạo đơn | Hoàn tác toàn bộ giao dịch (không có đơn, không giữ chỗ kho); báo lỗi chung. | Thử đặt lại. |
| **E15** | Bước 6, 8 | Khách bấm xác nhận hai lần liên tiếp hoặc gửi lại yêu cầu | Khóa idempotency bảo đảm chỉ một bản ghi thanh toán; giao diện vô hiệu hóa nút khi đang xử lý. | Chỉ có một đơn, một lần thanh toán. |

## 3. Quy tắc nghiệp vụ áp dụng

| Mã | Quy tắc | Dùng ở |
|----|---------|--------|
| BR-01 | Giá size: S = giá gốc × 0,8; M = × 1; L = × 1,2; topping có giá riêng | Bước 2, 4 |
| BR-02 | Tiền nước = tổng (giá món theo size + giá topping) × số lượng, trước khi trừ khuyến mãi | Bước 4, A8 |
| BR-03 | Tổng đơn = tiền nước − giảm giá khuyến mãi − giảm giá từ điểm + phí giao hàng | Bước 4 |
| BR-04 | Phí giao hàng 15.000đ; miễn phí khi tiền nước đạt ngưỡng (100.000đ theo quy tắc nhóm; **[Cần xác nhận]** code frontend đang là 150.000đ) | Bước 4, A8 |
| BR-05 | Đơn `PENDING` quá 10 phút tự hủy | E10 |
| BR-06 | Mã khuyến mãi: theo %, đơn tối thiểu, thời gian hiệu lực, giới hạn tổng lượt, mỗi tài khoản một mã một lần | A1, E7 |

## 4. Vòng đời đơn và thanh toán trong use-case

| Sự kiện | Trạng thái đơn | Trạng thái thanh toán | Kho |
|---------|----------------|-----------------------|-----|
| Tạo đơn (bước 7, 8) | `PENDING` | `PENDING` | Giữ chỗ |
| IPN thành công (bước 10) | `PAID` | `SUCCEEDED` | Trừ kho, giải phóng giữ chỗ |
| Thanh toán thất bại (E9) | `PAYMENT_FAILED` | `FAILED` | Vẫn giữ chỗ đến khi hủy hoặc hết hạn |
| Khách hủy, đơn chưa thanh toán (A5) | `CANCELLED` | Hủy/thất bại | Trả lại giữ chỗ |
| Quá hạn 10 phút (E10) | `CANCELLED` | Thất bại | Trả lại giữ chỗ |
| Khách hủy, đơn đã thanh toán (A6) | `CANCELLED` | Theo quyết định của nhóm | Trả lại tồn kho **[Cần xác nhận]** |

## 5. Dữ liệu vào và ra

| Bước | Dữ liệu vào | Dữ liệu ra |
|------|-------------|------------|
| Xem trước đơn | Danh sách món (mã món, size, số lượng, topping), mã giảm giá (tùy chọn), số điểm dùng (tùy chọn) | Tạm tính, phí giao, giảm giá, tổng tiền |
| Tạo đơn | Như trên, cộng họ tên, số điện thoại, địa chỉ người nhận | Mã đơn, trạng thái `PENDING`, tổng tiền |
| Tạo thanh toán | Mã đơn, phương thức, khóa idempotency | Mã thanh toán, URL VNPay, thời hạn |
| IPN và return | Tham số VNPay (mã giao dịch, số tiền, mã phản hồi, chữ ký) | Trạng thái đơn và thanh toán đã cập nhật; trang kết quả |

## 6. Use-case liên quan: Xem lịch sử đơn hàng

Sau khi đặt, khách dùng "Xem lịch sử đơn hàng" để theo dõi: tab "Đang xử lý" (`PENDING`, `PAID`, `PREPARING`, `READY`) và tab "Lịch sử" (`COMPLETED`, `CANCELLED`, `PAYMENT_FAILED`). Từ đây khách có thể thanh toán lại (A3) hoặc hủy đơn (A5, A6). Đặc tả riêng nếu giảng viên yêu cầu.

## 7. Điểm cần nhóm thống nhất

1. **Hủy đơn đã thanh toán:** sơ đồ có use-case này, nhưng `srs.md` (FR-25) đang ghi chưa chốt và danh sách Won't có "hoàn tiền tự động" (FR-50). Cần quyết định: cho hủy khi nào (chỉ khi `PAID`, trước `PREPARING`), tiền hoàn bằng cách nào (thủ công hay tự động), rồi cập nhật FR-25 và FR-50.
2. **Hủy đơn quá hạn:** use-case này không có tác nhân nào nối trong sơ đồ. Nên thêm tác nhân "Hệ thống" (tác vụ định kỳ) hoặc ghi chú rằng use-case do hệ thống tự kích hoạt.
3. Ngưỡng miễn phí giao hàng (100.000đ hay 150.000đ).
4. Thời điểm cộng điểm thưởng và cách trừ điểm khi hủy đơn đã thanh toán.
5. Cách xử lý khi IPN không tới trong lúc demo (E13).