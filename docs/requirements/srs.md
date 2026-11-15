# SRS rút gọn BrewLite: Yêu cầu chức năng và phi chức năng (Task 1.2)

> Tài liệu bám theo `context-and-scope.md` (Task 1.1). Mức ưu tiên MoSCoW: **Must** = MVP; **Should/Could** = phạm vi mở rộng; **Won't** = ngoài phạm vi.
> Mục có dấu **[Cần xác nhận]** là chỗ nhóm cần thống nhất trước khi chốt.

## 1. Giới thiệu

### 1.1 Mục đích
Liệt kê yêu cầu của hệ thống BrewLite theo dạng kiểm chứng được. Mỗi yêu cầu có mã định danh, mức ưu tiên và tiêu chí chấp nhận (AC) để làm căn cứ viết test.

### 1.2 Quy ước
| Mục | Quy ước |
|-----|---------|
| Mã yêu cầu chức năng | `FR-01`, `FR-02`, ... |
| Mã yêu cầu phi chức năng | `NFR-01`, `NFR-02`, ... |
| Mã tiêu chí chấp nhận | `AC1`, `AC2`, ... trong từng yêu cầu. Khi viết test, đặt tên `TC-<mã yêu cầu>-<số AC>`, ví dụ `TC-FR-09-AC2` |
| Vai trò | CUSTOMER (khách hàng), BARISTA (nhân viên quầy), ADMIN (quản lý), VNPay (hệ thống ngoài) |
| Trạng thái đơn | `PENDING` → `PAID` → `PREPARING` → `READY` → `COMPLETED`; nhánh phụ `PAYMENT_FAILED`, `CANCELLED` |
| Dạng AC | Mỗi AC viết như một ca kiểm thử: điều kiện đầu, thao tác, kết quả mong đợi, có số liệu cụ thể |

### 1.3 Quy tắc nghiệp vụ dùng chung
| Mã | Quy tắc |
|----|---------|
| BR-01 | Giá theo size: S = giá gốc × 0,8; M = × 1; L = × 1,2 (giá gốc là `price` trong cơ sở dữ liệu). Topping có giá riêng. |
| BR-02 | Tiền nước = tổng (giá món theo size + giá topping) × số lượng, tính trước khi trừ khuyến mãi. |
| BR-03 | Tổng đơn = tiền nước − giảm giá khuyến mãi − giảm giá từ điểm + phí giao hàng. |
| BR-04 | Phí giao hàng mặc định 15.000đ; miễn phí khi tiền nước đạt ngưỡng miễn phí giao hàng. Ngưỡng theo quy tắc nhóm là **100.000đ**. **[Cần xác nhận: `FREE_DELIVERY_THRESHOLD` trong `frontend/lib/cart-store.ts` đang là 150.000đ, cần thống nhất.]** |
| BR-05 | Đơn `PENDING` quá 10 phút chưa thanh toán bị tự hủy. |
| BR-06 | Mã khuyến mãi: theo %, có đơn tối thiểu, có thời gian hiệu lực, có giới hạn tổng lượt dùng, mỗi tài khoản dùng một mã một lần. |

## 2. Sơ đồ use-case tổng quát

Sơ đồ use-case toàn hệ thống do nhóm vẽ bằng PlantUML: **[chèn đường dẫn hoặc hình sơ đồ, ví dụ `docs/diagrams/usecase-overview.png`]**.

Bảng dưới liên kết tác nhân trên sơ đồ với các yêu cầu chức năng, để kiểm tra mỗi use-case đều có yêu cầu tương ứng.

| Tác nhân | Use-case chính | Yêu cầu liên quan |
|----------|----------------|-------------------|
| Khách chưa đăng nhập | Đăng ký, đăng nhập, xem menu, xem chi tiết món | FR-01, FR-02, FR-05 đến FR-11, FR-44 |
| CUSTOMER | Quản lý giỏ hàng, áp mã, dùng điểm, đặt đơn, thanh toán, xem và hủy đơn | FR-12 đến FR-33 |
| BARISTA | Xem đơn cần làm, cập nhật trạng thái đơn | FR-34, FR-35 |
| ADMIN | Quản lý sản phẩm, kho, khuyến mãi; xem đơn và doanh thu | FR-37 đến FR-43 |
| VNPay | Nhận yêu cầu thanh toán, trả kết quả | FR-26 đến FR-29 |
| Hệ thống (tự động) | Giữ chỗ kho, tự hủy đơn quá hạn, trừ kho | FR-23, FR-24, FR-36 |

## 3. Yêu cầu chức năng

### 3.1 Xác thực và phân quyền

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| FR-01 | Người dùng đăng ký tài khoản bằng email và mật khẩu. Tài khoản mới có vai trò CUSTOMER. | Must | AC1. Nhập email chưa dùng và mật khẩu hợp lệ thì tạo tài khoản, vai trò CUSTOMER.<br>AC2. Nhập email đã tồn tại thì báo lỗi, không tạo tài khoản mới.<br>AC3. Email sai định dạng hoặc mật khẩu rỗng thì báo lỗi và không gửi được form.<br>AC4. Mật khẩu không bao giờ xuất hiện trong phản hồi của API. |
| FR-02 | Người dùng đăng nhập bằng email và mật khẩu; hệ thống cấp JWT và điều hướng theo vai trò. | Must | AC1. Đúng email và mật khẩu thì nhận token, giao diện chuyển trang theo vai trò (CUSTOMER về menu, BARISTA về trang barista, ADMIN về trang quản trị).<br>AC2. Sai mật khẩu hoặc email không tồn tại thì báo "sai thông tin đăng nhập", không phân biệt trường nào sai.<br>AC3. Token hết hạn hoặc không hợp lệ thì API trả 401. |
| FR-03 | Người dùng đăng xuất; token cũ bị vô hiệu. | Must | AC1. Sau khi đăng xuất, giao diện xóa token và về trạng thái chưa đăng nhập.<br>AC2. Dùng lại token cũ gọi API cần đăng nhập thì bị từ chối (401), nhờ `tokenVersion` tăng lên. |
| FR-04 | Hệ thống chặn truy cập trái vai trò. | Must | AC1. CUSTOMER gọi API của `/barista` hoặc `/admin` thì nhận 403.<br>AC2. BARISTA gọi API của `/admin` thì nhận 403.<br>AC3. Người chưa đăng nhập mở trang cần đăng nhập thì bị chuyển về trang đăng nhập.<br>AC4. Giao diện hiển thị trang 403 khi người dùng mở trang không đủ quyền. |

### 3.2 Thực đơn

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| FR-05 | Hiển thị danh sách sản phẩm (ảnh, tên, danh mục, giá, nút thêm vào giỏ). | Must | AC1. Mở trang menu thì hiển thị toàn bộ sản phẩm từ `GET /products`.<br>AC2. Mỗi thẻ có ảnh, tên, giá định dạng VND (ví dụ 35.000đ).<br>AC3. Sản phẩm thiếu ảnh hiển thị ảnh thay thế, không làm vỡ bố cục.<br>AC4. Khi backend không trả lời, giao diện hiện thông báo lỗi dễ hiểu, không trắng trang. |
| FR-06 | Lọc sản phẩm theo danh mục. | Must | AC1. Chọn "Cà phê" thì chỉ còn sản phẩm có danh mục Cà phê.<br>AC2. Chọn "Tất cả" thì hiện đủ sản phẩm.<br>AC3. Danh mục không có sản phẩm hiện thông báo "chưa có món". |
| FR-07 | Tìm kiếm sản phẩm theo tên. | Must | AC1. Gõ một phần tên (không phân biệt hoa thường) thì danh sách chỉ còn các món khớp.<br>AC2. Không có món khớp thì hiện thông báo không tìm thấy.<br>AC3. Xóa ô tìm kiếm thì danh sách trở lại đầy đủ. |
| FR-08 | Sắp xếp sản phẩm (mặc định theo bán chạy). | Should | AC1. Mặc định sắp xếp theo `soldCount` giảm dần.<br>AC2. Chọn kiểu sắp xếp khác (ví dụ giá) thì thứ tự thay đổi đúng. |

### 3.3 Chi tiết sản phẩm

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| FR-09 | Xem chi tiết một sản phẩm. | Must | AC1. Mở `/products/:id` hợp lệ thì hiển thị tên, ảnh, giá, các lựa chọn size và topping.<br>AC2. Mở id không tồn tại thì hiện thông báo không tìm thấy, không báo lỗi hệ thống. |
| FR-10 | Chọn size S/M/L; giá hiển thị theo quy tắc BR-01. | Must | AC1. Món giá gốc 30.000đ: size S hiện 24.000đ, M hiện 30.000đ, L hiện 36.000đ.<br>AC2. Đổi size thì giá cập nhật ngay, không cần tải lại.<br>AC3. Mặc định chọn size M. |
| FR-11 | Chọn topping; hiển thị đủ danh sách topping lấy từ bảng Topping, mỗi topping có giá riêng. | Must | AC1. Danh sách topping trên trang khớp với dữ liệu `Topping` của backend.<br>AC2. Chọn thêm topping thì tổng giá món tăng đúng bằng giá topping.<br>AC3. Bỏ chọn topping thì giá giảm tương ứng.<br>AC4. Topping hết tồn kho (stock = 0) bị vô hiệu hóa, không chọn được. |

### 3.4 Giỏ hàng

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| FR-12 | Thêm món vào giỏ. | Must | AC1. Bấm "Thêm vào giỏ hàng" thì giỏ có thêm món với đúng size, topping, giá.<br>AC2. Thêm lại món giống hệt (cùng món, size, topping) thì tăng số lượng thêm 1, không tạo dòng mới.<br>AC3. Thêm món khác size thì tạo dòng riêng. |
| FR-13 | Đổi số lượng và xóa món trong giỏ. | Must | AC1. Tăng/giảm số lượng thì thành tiền cập nhật ngay.<br>AC2. Giảm số lượng về 0 thì món bị xóa khỏi giỏ.<br>AC3. Giỏ trống hiển thị thông báo giỏ hàng trống và không cho đặt đơn. |
| FR-14 | Hiển thị tạm tính, phí giao hàng, giảm giá và tổng tiền theo BR-02 đến BR-04. | Must | AC1. Tiền nước dưới ngưỡng miễn phí thì phí giao là 15.000đ.<br>AC2. Tiền nước đạt hoặc vượt ngưỡng thì phí giao là 0đ.<br>AC3. Giỏ trống thì phí giao là 0đ.<br>AC4. Tổng = tạm tính + phí giao − giảm giá; số liệu khớp với kết quả của `POST /checkout/preview`. |
| FR-15 | Biểu tượng giỏ ở Header hiển thị tổng số ly trong giỏ. | Should | AC1. Thêm 1 ly thì số trên Header tăng 1.<br>AC2. Số hiển thị bằng tổng số lượng của mọi dòng, không phải số dòng.<br>AC3. Số về 0 khi giỏ trống. |
| FR-16 | Giỏ hàng được giữ lại khi tải lại trang. | Could | AC1. Thêm món, tải lại trang (F5) thì giỏ vẫn còn đúng món và số lượng.<br>AC2. Sau khi đặt đơn thành công, giỏ được xóa. |

### 3.5 Khuyến mãi và điểm thưởng

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| FR-17 | Áp mã khuyến mãi vào đơn theo BR-06. | Should | AC1. Nhập mã hợp lệ, đủ đơn tối thiểu thì số tiền giảm hiển thị đúng và tổng tiền cập nhật.<br>AC2. Mã không tồn tại, đã tắt, chưa tới hạn (`startAt`) hoặc đã hết hạn (`expiredAt`) thì báo lỗi, không giảm giá.<br>AC3. Tạm tính nhỏ hơn đơn tối thiểu (`minOrder`) thì báo lỗi nêu rõ mức tối thiểu.<br>AC4. Tổng lượt dùng đã đạt `usageLimit` thì báo hết lượt.<br>AC5. Tài khoản đã dùng mã này trước đó thì bị từ chối. |
| FR-18 | Gỡ mã khi tạm tính giảm xuống dưới đơn tối thiểu. | Should | AC1. Đang áp mã, giảm số lượng làm tạm tính thấp hơn `minOrder` thì mã tự gỡ và tổng tiền tính lại.<br>AC2. Người dùng bấm gỡ mã thì giảm giá về 0. |
| FR-19 | Tích điểm thưởng cho đơn. | Could | AC1. Đơn có tạm tính 50.000đ thì được 50 điểm (1 điểm cho mỗi 1.000đ, làm tròn xuống). **[Cần xác nhận quy tắc và thời điểm cộng điểm]**<br>AC2. Mỗi lần cộng điểm có một bản ghi `LoyaltyTransaction` với lý do.<br>AC3. `GET /users/me/loyalty` trả đúng số điểm hiện có. |
| FR-20 | Dùng điểm thưởng để giảm tiền. | Could | AC1. Dùng số điểm không vượt quá số điểm hiện có thì tiền giảm bằng số điểm × giá trị quy đổi 1 điểm. **[Cần xác nhận giá trị quy đổi]**<br>AC2. Nhập số điểm vượt số hiện có thì bị từ chối.<br>AC3. Điểm đang dùng cho đơn chờ thanh toán được giữ chỗ (`reservedPoints`); đơn bị hủy thì trả lại điểm. |

### 3.6 Đặt đơn

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| FR-21 | Xem trước đơn hàng (checkout preview) trước khi đặt. | Must | AC1. Gọi `POST /checkout/preview` với giỏ hàng thì nhận về tạm tính, phí giao, giảm giá, tổng tiền theo BR-01 đến BR-04.<br>AC2. Giỏ chứa món đã bị xóa hoặc không tồn tại thì trả lỗi rõ ràng.<br>AC3. Cần đăng nhập mới gọi được. |
| FR-22 | Tạo đơn với thông tin người nhận. | Must | AC1. Nhập đủ tên, số điện thoại, địa chỉ thì tạo đơn ở trạng thái `PENDING`, trả về mã đơn.<br>AC2. Thiếu một trong ba thông tin hoặc số điện thoại sai định dạng thì báo lỗi, không tạo đơn.<br>AC3. Giá lưu trong đơn (`unitPrice`, `lineTotal`) do backend tính lại, không tin giá gửi từ frontend.<br>AC4. Giỏ rỗng thì không tạo được đơn. |
| FR-23 | Giữ chỗ nguyên liệu, topping (và điểm nếu có) ngay khi tạo đơn. | Must | AC1. Sau khi tạo đơn, `reservedQuantity` của nguyên liệu và topping liên quan tăng đúng theo công thức × size × số lượng.<br>AC2. Nếu một nguyên liệu hoặc topping không đủ tồn khả dụng (tồn kho − giữ chỗ) thì từ chối tạo đơn và báo món nào thiếu.<br>AC3. Tạo đơn thất bại thì không có phần giữ chỗ nào bị thay đổi. |
| FR-24 | Tự hủy đơn `PENDING` quá 10 phút và trả lại phần giữ chỗ (BR-05). | Must | AC1. Đơn `PENDING` tạo quá 10 phút trước, chưa thanh toán, được chuyển sang `CANCELLED` ở lần chạy tác vụ định kỳ kế tiếp.<br>AC2. Phần giữ chỗ kho và điểm của đơn đó được trả lại đúng số lượng.<br>AC3. Đơn đã `PAID` không bị tự hủy. |
| FR-25 | Khách hủy đơn của mình khi còn được phép. | Must | AC1. Đơn `PENDING` thì hủy được, trạng thái chuyển `CANCELLED`, trả lại giữ chỗ.<br>AC2. Đơn đã `PREPARING`, `READY` hoặc `COMPLETED` thì không hủy được và báo lý do. **[Cần xác nhận: có cho hủy đơn `PAID` chưa vào chế biến không]**<br>AC3. Khách không hủy được đơn của người khác (403 hoặc 404). |

### 3.7 Thanh toán

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| FR-26 | Tạo yêu cầu thanh toán VNPay cho đơn `PENDING`. | Must | AC1. Gọi `POST /payments` với đơn hợp lệ thì tạo bản ghi `Payment` trạng thái `PENDING`, số tiền bằng tổng đơn, và trả về URL chuyển sang VNPay.<br>AC2. Đơn không phải `PENDING` hoặc không thuộc về người gọi thì bị từ chối.<br>AC3. URL có chữ ký hợp lệ theo cấu hình VNPay. |
| FR-27 | Xử lý kết quả khi người dùng quay về từ VNPay (return URL). | Must | AC1. Thanh toán thành công thì giao diện hiện trang kết quả thành công kèm mã đơn.<br>AC2. Thanh toán thất bại hoặc hủy thì hiện trang thất bại và cho phép quay lại giỏ hoặc thanh toán lại.<br>AC3. Tham số trả về bị sửa (sai chữ ký) thì không đổi trạng thái đơn. |
| FR-28 | Nhận thông báo kết quả (IPN) từ VNPay và cập nhật đơn. | Must | AC1. IPN thành công có chữ ký đúng và đúng số tiền thì `Payment` thành `SUCCEEDED`, đơn thành `PAID`, và `PromotionUsage` được ghi nhận nếu có dùng mã.<br>AC2. IPN sai chữ ký thì trả mã lỗi cho VNPay, không đổi trạng thái.<br>AC3. IPN thất bại thì `Payment` thành `FAILED`, đơn thành `PAYMENT_FAILED`.<br>AC4. Số tiền IPN khác số tiền đơn thì từ chối. |
| FR-29 | Chống ghi nhận thanh toán trùng. | Must | AC1. Gửi `POST /payments` hai lần với cùng `idempotencyKey` thì chỉ có một bản ghi `Payment`.<br>AC2. VNPay gọi IPN lặp lại cho cùng giao dịch thì lần sau không làm đổi thêm dữ liệu (không cộng điểm, không ghi lượt dùng mã lần hai). |
| FR-30 | Cho phép hủy thanh toán đang chờ của một đơn. | Should | AC1. Gọi `POST /payments/orders/:orderId/cancel` với thanh toán `PENDING` thì thanh toán chuyển sang trạng thái hủy/thất bại và đơn có thể thanh toán lại hoặc bị hủy.<br>AC2. Thanh toán đã `SUCCEEDED` thì không hủy được. |

### 3.8 Lịch sử đơn

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| FR-31 | Khách xem danh sách đơn của mình (đang xử lý và lịch sử). | Must | AC1. `GET /orders/me` chỉ trả đơn của người đang đăng nhập.<br>AC2. Trang `/orders` có 2 tab: "Đang xử lý" gồm `PENDING`, `PAID`, `PREPARING`, `READY`; "Lịch sử" gồm `COMPLETED`, `CANCELLED`, `PAYMENT_FAILED`.<br>AC3. Mỗi đơn hiển thị mã, thời gian, trạng thái, tổng tiền.<br>AC4. Tài khoản chưa có đơn thì hiện thông báo trống. |
| FR-32 | Khách xem chi tiết một đơn. | Should | AC1. Chi tiết gồm danh sách món (tên, size, topping, số lượng, thành tiền), tạm tính, phí giao, giảm giá, tổng tiền, thông tin người nhận.<br>AC2. Số liệu khớp với lúc đặt đơn. |
| FR-33 | Cho khách thanh toán lại đơn `PENDING` chưa quá hạn từ trang đơn hàng. | Could | AC1. Đơn `PENDING` còn hạn có nút thanh toán, bấm thì chuyển sang VNPay.<br>AC2. Đơn đã quá hạn hoặc đã hủy không hiện nút thanh toán. |

### 3.9 Quản lý trạng thái đơn và kho

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| FR-34 | Barista xem danh sách đơn cần xử lý. | Must | AC1. `GET /barista/orders` chỉ trả các đơn cần làm (đã thanh toán, chưa hoàn tất).<br>AC2. Mỗi đơn hiển thị món, size, topping, số lượng, thời gian đặt.<br>AC3. Đơn `PENDING` chưa thanh toán không xuất hiện.<br>AC4. Chỉ BARISTA hoặc ADMIN truy cập được. |
| FR-35 | Barista cập nhật trạng thái đơn theo đúng thứ tự. | Must | AC1. `PATCH /barista/orders/:id` chuyển được `PAID` → `PREPARING` → `READY` → `COMPLETED`.<br>AC2. Nhảy bước (ví dụ `PAID` sang `COMPLETED`) hoặc lùi trạng thái bị từ chối với thông báo lỗi.<br>AC3. Đơn đã `COMPLETED` hoặc `CANCELLED` không đổi được nữa.<br>AC4. Sau khi đổi, khách thấy trạng thái mới ở trang đơn hàng. |
| FR-36 | Trừ kho nguyên liệu và topping theo công thức, size, số lượng khi đơn được thanh toán. | Must | AC1. Món có công thức 20g cà phê, đơn 2 ly size L thì khi đơn lên `PAID`, tồn kho cà phê giảm 20 × 1,2 × 2 = 48g.<br>AC2. Phần giữ chỗ tương ứng được giải phóng, không bị trừ hai lần.<br>AC3. Topping trừ `stock` đúng số lượng.<br>AC4. Đơn bị hủy trước khi thanh toán thì tồn kho không đổi. |

### 3.10 Quản trị (Admin)

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| FR-37 | Admin thêm, sửa, xóa sản phẩm. | Must | AC1. Thêm sản phẩm hợp lệ (tên, giá, danh mục, ảnh) thì xuất hiện ở menu.<br>AC2. Sửa giá hoặc tên thì menu hiển thị giá trị mới.<br>AC3. Xóa sản phẩm thì không còn ở menu; đơn cũ có chứa sản phẩm đó vẫn xem được.<br>AC4. Giá âm hoặc tên rỗng bị từ chối.<br>AC5. Người không phải ADMIN nhận 403. |
| FR-38 | Admin quản lý nguyên liệu và nhập kho nguyên liệu. | Must | AC1. Tạo nguyên liệu mới (tên, đơn vị, tồn ban đầu).<br>AC2. `POST /admin/ingredients/:id/import` với số lượng dương thì tồn kho tăng đúng số đó.<br>AC3. Số lượng nhập bằng 0 hoặc âm bị từ chối. |
| FR-39 | Admin quản lý topping và nhập kho topping. | Must | AC1. Tạo topping mới (tên, giá, tồn).<br>AC2. `POST /admin/toppings/:id/import` với số lượng dương thì tồn kho tăng đúng.<br>AC3. Số lượng không hợp lệ bị từ chối. |
| FR-40 | Admin xem tồn kho. | Must | AC1. `GET /admin/inventory` liệt kê nguyên liệu và topping với tồn kho, số lượng giữ chỗ, đơn vị.<br>AC2. Mục sắp hết hàng được làm nổi bật. **[Cần xác nhận ngưỡng "sắp hết"]** |
| FR-41 | Admin quản lý khuyến mãi (tạo, xem, sửa, tắt). | Should | AC1. Tạo mã mới với mã, giá trị giảm, loại, đơn tối thiểu, thời gian hiệu lực, giới hạn lượt.<br>AC2. Mã trùng với mã đã có bị từ chối.<br>AC3. "Xóa" mã là xóa mềm (`active = false`); mã đó không dùng được nữa nhưng lịch sử lượt dùng vẫn còn.<br>AC4. Sửa mã thì giá trị mới áp dụng cho các đơn sau. |
| FR-42 | Admin xem báo cáo doanh thu. | Should | AC1. `GET /admin/reports/revenue` trả doanh thu theo khoảng thời gian được chọn.<br>AC2. Chỉ tính các đơn đã thanh toán, không tính đơn `CANCELLED` và `PAYMENT_FAILED`.<br>AC3. Số liệu khớp với tổng của các đơn trong khoảng thời gian đó. |
| FR-43 | Admin xem danh sách đơn hàng. | Should | AC1. Xem được đơn của mọi khách, lọc được theo trạng thái.<br>AC2. Hiển thị mã đơn, khách, tổng tiền, trạng thái, thời gian. |
| FR-44 | Trang "Về chúng tôi". | Could | AC1. Trang `/about` hiển thị địa chỉ (Quận 5, TP.HCM), giờ mở cửa (7:00–22:00), điện thoại, email.<br>AC2. Truy cập được từ Header, không cần đăng nhập. |

### 3.11 Ngoài phạm vi (Won't)

Các yêu cầu sau ghi nhận để thống nhất ranh giới; không thiết kế và không kiểm thử trong đồ án này.

| Mã | Yêu cầu | Ưu tiên | Ghi chú |
|----|---------|---------|---------|
| FR-45 | Thanh toán tiền mặt (COD) và ví điện tử khác ngoài VNPay | Won't | Chỉ dùng VNPay |
| FR-46 | Ứng dụng di động iOS/Android | Won't | Chỉ làm web responsive |
| FR-47 | Theo dõi shipper thời gian thực, tích hợp đơn vị vận chuyển | Won't | Ngoài nguồn lực |
| FR-48 | Đánh giá, bình luận sản phẩm | Won't | Không có trong yêu cầu |
| FR-49 | Thông báo đẩy, SMS, email giao dịch | Won't | Không có trong yêu cầu |
| FR-50 | Hoàn tiền tự động qua VNPay | Won't | **[Cần xác nhận]** `PaymentStatus` có `REFUNDED` nhưng chưa làm luồng hoàn tiền |

## 4. Yêu cầu phi chức năng

Các con số mục tiêu dưới đây là đề xuất cho môi trường demo (máy cá nhân, dữ liệu mẫu vài chục sản phẩm). **[Cần xác nhận với nhóm]**

### 4.1 Hiệu năng

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| NFR-01 | Trang menu tải nhanh. | Must | AC1. Với 50 sản phẩm, trang menu hiển thị đầy đủ nội dung trong tối đa 3 giây khi chạy trên mạng thường (đo bằng thẻ Network của trình duyệt, tải lần đầu).<br>AC2. Ảnh sản phẩm có kích thước hợp lý, mỗi ảnh không quá 500 KB. |
| NFR-02 | API đọc phản hồi nhanh. | Should | AC1. `GET /products` và `GET /orders/me` có thời gian phản hồi trung vị dưới 500 ms với 20 người dùng đồng thời (đo bằng công cụ như k6 hoặc Postman runner).<br>AC2. Không có truy vấn N+1 gây chậm khi tải danh sách sản phẩm kèm topping. |
| NFR-03 | Tạo đơn không gây chờ lâu. | Should | AC1. `POST /orders` hoàn tất trong tối đa 2 giây (không tính thời gian ở trang VNPay) với giỏ 10 món. |

### 4.2 Bảo mật

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| NFR-04 | Mật khẩu được băm. | Must | AC1. Cột `passwordHash` trong cơ sở dữ liệu không chứa mật khẩu gốc.<br>AC2. Hai tài khoản cùng mật khẩu có hai giá trị băm khác nhau (có salt). |
| NFR-05 | Mọi API cần đăng nhập đều kiểm tra token và vai trò. | Must | AC1. Gọi API cần đăng nhập mà không có token thì nhận 401.<br>AC2. Gọi API không đủ vai trò thì nhận 403.<br>AC3. Mỗi API ở mục 3 đều có ít nhất một ca kiểm thử về quyền truy cập. |
| NFR-06 | Khách chỉ truy cập được dữ liệu của mình. | Must | AC1. Khách A gọi xem, hủy hoặc thanh toán đơn của khách B thì bị từ chối.<br>AC2. Danh sách đơn của khách không bao giờ chứa đơn người khác. |
| NFR-07 | Xác thực dữ liệu từ VNPay. | Must | AC1. Mọi yêu cầu return và IPN đều được kiểm tra chữ ký trước khi xử lý.<br>AC2. Yêu cầu giả mạo không làm đổi trạng thái đơn hay thanh toán. |
| NFR-08 | Không để lộ bí mật cấu hình. | Must | AC1. Tệp `.env` nằm trong `.gitignore`, không có trong lịch sử commit.<br>AC2. Khóa JWT và khóa VNPay chỉ đọc từ biến môi trường, không viết cứng trong mã nguồn. |
| NFR-09 | Kiểm tra dữ liệu đầu vào ở backend. | Must | AC1. Dữ liệu sai kiểu, thiếu trường bắt buộc, số âm bị từ chối với mã 400 và thông báo rõ.<br>AC2. Giá và tổng tiền luôn do backend tính, bỏ qua giá do client gửi. |

### 4.3 Toàn vẹn dữ liệu và độ tin cậy

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| NFR-10 | Các thao tác nhiều bước chạy trong giao dịch (transaction). | Must | AC1. Tạo đơn, giữ chỗ kho, ghi lượt dùng mã, trừ điểm hoặc thành công cả hoặc không thay đổi gì.<br>AC2. Giả lập lỗi giữa chừng thì dữ liệu không bị lệch (kho không bị giữ chỗ thừa). |
| NFR-11 | Tồn kho không bị âm khi nhiều người đặt cùng lúc. | Must | AC1. Nguyên liệu còn đủ cho 1 ly, hai yêu cầu đặt đồng thời thì chỉ một đơn được tạo, đơn còn lại bị từ chối vì hết hàng.<br>AC2. Sau thử nghiệm, tồn kho và giữ chỗ không âm. |
| NFR-12 | Tác vụ tự hủy đơn quá hạn chạy đều và không lỗi. | Must | AC1. Tác vụ định kỳ chạy mỗi phút không phát sinh lỗi trong log khi cơ sở dữ liệu đúng schema.<br>AC2. Khi một lần chạy lỗi, lần sau vẫn chạy tiếp. |

### 4.4 Tính khả dụng (usability)

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| NFR-13 | Giao diện responsive. | Must | AC1. Hiển thị đúng, không tràn ngang ở bề rộng 360px, 768px, 1440px.<br>AC2. Các nút bấm chính dễ chạm trên điện thoại (vùng chạm tối thiểu khoảng 40px). |
| NFR-14 | Giao diện tiếng Việt, định dạng tiền VND. | Must | AC1. Mọi nhãn, thông báo hiển thị bằng tiếng Việt.<br>AC2. Tiền có dấu chấm phân cách hàng nghìn và ký hiệu đ (ví dụ 35.000đ). |
| NFR-15 | Thông báo lỗi dễ hiểu. | Must | AC1. Mọi lỗi người dùng gặp (sai mật khẩu, hết hàng, mã khuyến mãi sai, mất kết nối) đều có thông báo nêu nguyên nhân và hướng xử lý.<br>AC2. Không hiển thị mã lỗi kỹ thuật hoặc stack trace cho người dùng. |
| NFR-16 | Giao diện bám thiết kế Figma. | Should | AC1. Màu nền, bố cục, phông chữ, khoảng cách của các trang chính khớp bản Figma khi đối chiếu bằng mắt (nền `#F8F5F0`, bố cục rộng 1440px).<br>AC2. Mỗi trang chính được thành viên review đối chiếu Figma trước khi gộp PR. |
| NFR-17 | Có trạng thái đang tải và trạng thái rỗng. | Should | AC1. Khi chờ dữ liệu, giao diện hiện trạng thái đang tải.<br>AC2. Danh sách rỗng (giỏ, đơn, kết quả tìm) có thông báo thay vì để trống. |
| NFR-18 | Tương thích trình duyệt. | Should | AC1. Chạy đúng trên bản mới của Chrome, Edge, Firefox. |

### 4.5 Khả năng triển khai và bảo trì

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|----|---------|---------|--------------------|
| NFR-19 | Dựng được môi trường bằng Docker. | Should | AC1. Từ máy sạch có Docker, chạy theo hướng dẫn trong README thì cơ sở dữ liệu PostgreSQL khởi động được.<br>AC2. Không cần cài tay thêm thành phần nào ngoài những gì README nêu. |
| NFR-20 | Cấu hình qua biến môi trường. | Must | AC1. Repo có tệp mẫu `.env.example` liệt kê đủ các biến cần thiết (kết nối cơ sở dữ liệu, JWT, VNPay, địa chỉ backend).<br>AC2. Đổi cấu hình chỉ cần sửa `.env`, không sửa mã nguồn. |
| NFR-21 | Dựng được dữ liệu từ đầu. | Must | AC1. Trên cơ sở dữ liệu trống, chạy migration rồi seed thì có đủ sản phẩm, topping, nguyên liệu, công thức và tài khoản mẫu cho 3 vai trò.<br>AC2. Migration không bị lỗi lệch (drift) khi chạy theo thứ tự trong README. |
| NFR-22 | Mã nguồn biên dịch sạch. | Must | AC1. Backend và frontend biên dịch với 0 lỗi TypeScript.<br>AC2. Không đẩy lên `main` khi build lỗi. |
| NFR-23 | Có tài liệu API. | Should | AC1. Swagger tại `/api` liệt kê đủ các endpoint ở mục 3 kèm dữ liệu vào/ra. |
| NFR-24 | Tuân thủ quy ước Git của nhóm. | Should | AC1. Mỗi chức năng một nhánh `feature/<tên-chức-năng>`, commit dạng `feat(<mô-đun>): mô tả`, gộp qua Pull Request có người review.<br>AC2. Không có `node_modules`, `.env` trong commit. |

## 5. Tóm tắt ưu tiên

| Mức | Ý nghĩa trong dự án | Gồm các nhóm |
|-----|--------------------|--------------|
| **Must** | MVP; thiếu thì hệ thống không dùng được | Xác thực, menu, chi tiết món, giỏ hàng, đặt đơn, thanh toán VNPay, lịch sử đơn, barista, quản trị sản phẩm và kho, bảo mật, toàn vẹn dữ liệu |
| **Should** | Quan trọng, làm ngay sau MVP | Sắp xếp, hiển thị số lượng giỏ, khuyến mãi, hủy thanh toán, chi tiết đơn, báo cáo doanh thu, hiệu năng, Docker, Swagger |
| **Could** | Có thì tốt | Lưu giỏ hàng, điểm thưởng, thanh toán lại, trang "Về chúng tôi" |
| **Won't** | Không làm trong đồ án này | COD, ứng dụng di động, theo dõi shipper, đánh giá, thông báo, hoàn tiền tự động |

## 6. Điểm cần nhóm thống nhất

1. Ngưỡng miễn phí giao hàng: 100.000đ hay 150.000đ (BR-04).
2. Có cho hủy đơn đã `PAID` nhưng chưa chế biến không (FR-25).
3. Quy tắc tích điểm, quy đổi điểm và thời điểm cộng điểm (FR-19, FR-20).
4. Có làm hoàn tiền không (FR-50).
5. Ngưỡng "sắp hết hàng" của tồn kho (FR-40).
6. Các con số hiệu năng ở mục 4.1 có phù hợp với nhóm không.
7. Đường dẫn hoặc hình sơ đồ use-case để chèn vào mục 2.