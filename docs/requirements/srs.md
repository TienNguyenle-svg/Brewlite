# SRS BrewLite: Yêu cầu chức năng và phi chức năng (Task 1.2)

## 1. Giới thiệu

### 1.1 Mục đích

Tài liệu này mô tả các yêu cầu chức năng và phi chức năng của website đặt đồ uống BrewLite. Mỗi yêu cầu có mã định danh, mức ưu tiên và tiêu chí chấp nhận để nhóm phát triển, kiểm thử và đối chiếu với sản phẩm thực tế.

### 1.2 Quy ước

| Mục | Quy ước |
|---|---|
| Yêu cầu chức năng | FR-01, FR-02, ... |
| Yêu cầu phi chức năng | NFR-01, NFR-02, ... |
| Tiêu chí chấp nhận | AC1, AC2, ... trong từng yêu cầu |
| Mã kiểm thử | `TC-<mã yêu cầu>-<số AC>`, ví dụ `TC-FR-09-AC2` |
| Vai trò | CUSTOMER, BARISTA, ADMIN, VNPay |
| Trạng thái đơn | `PENDING` → `PAID` → `PREPARING` → `READY` → `COMPLETED` |
| Trạng thái phụ | `PAYMENT_FAILED`, `CANCELLED` |

Mỗi tiêu chí chấp nhận cần nêu rõ điều kiện kiểm thử, thao tác thực hiện và kết quả mong đợi.

### 1.3 Quy tắc nghiệp vụ

| Mã | Quy tắc |
|---|---|
| BR-01 | Giá sản phẩm phụ thuộc vào size. Size S bằng 80% giá gốc, M bằng 100%, L bằng 120%. Giá gốc lấy từ trường `price` trong cơ sở dữ liệu. Topping được tính riêng. |
| BR-02 | Tiền nước được tính bằng tổng giá món theo size cộng giá topping, sau đó nhân với số lượng. Khoản này chưa trừ khuyến mãi. |
| BR-03 | Tổng tiền đơn hàng = tiền nước - giảm giá khuyến mãi - giảm giá từ điểm thưởng + phí giao hàng. |
| BR-04 | Phí giao hàng mặc định là 15.000đ. Đơn đạt ngưỡng miễn phí giao hàng sẽ không tính phí này. Quy tắc nhóm đang sử dụng mức 100.000đ.
| BR-05 | Đơn hàng ở trạng thái `PENDING` quá 10 phút mà chưa thanh toán sẽ tự động bị hủy. |
| BR-06 | Mã khuyến mãi giảm theo phần trăm, có giá trị đơn tối thiểu, thời gian áp dụng và giới hạn lượt sử dụng. Mỗi tài khoản chỉ được sử dụng một mã một lần. |

## 2. Sơ đồ use-case tổng quát

Sơ đồ use-case tổng quát mô tả các chức năng chính của hệ thống BrewLite và sự tương tác giữa người dùng với hệ thống. Hệ thống có ba vai trò chính: Khách hàng (CUSTOMER), Quản trị viên (ADMIN) và Nhân viên pha chế (BARISTA).

Các vai trò sử dụng chung chức năng đăng nhập và đăng xuất. Sau khi đăng nhập, hệ thống xác thực tài khoản và kiểm tra quyền truy cập. Người dùng chỉ được sử dụng những chức năng thuộc vai trò của mình.

**[Chèn hình sơ đồ use-case tổng quát của hệ thống BrewLite]**

### 2.1. Các tác nhân và chức năng

| Tác nhân | Chức năng | Yêu cầu liên quan |
|---|---|---|
| Khách hàng (CUSTOMER) | Đăng ký tài khoản, đăng nhập, đăng xuất | FR-01 đến FR-03 |
| Khách hàng (CUSTOMER) | Xem menu và chi tiết sản phẩm, chọn size và topping | FR-05 đến FR-11 |
| Khách hàng (CUSTOMER) | Quản lý giỏ hàng | FR-12 đến FR-16 |
| Khách hàng (CUSTOMER) | Đặt hàng và thanh toán | FR-17 đến FR-30 |
| Khách hàng (CUSTOMER) | Xem lịch sử đơn hàng | FR-31 đến FR-33 |
| Quản trị viên (ADMIN) | Đăng nhập, đăng xuất | FR-02, FR-03 |
| Quản trị viên (ADMIN) | Quản lý sản phẩm (thêm, sửa, xóa) | FR-37 |
| Quản trị viên (ADMIN) | Quản lý kho nguyên liệu | FR-38 đến FR-40 |
| Quản trị viên (ADMIN) | Quản lý đơn hàng | FR-43 |
| Quản trị viên (ADMIN) | Xem thống kê doanh thu | FR-42 |
| Quản trị viên (ADMIN) | Quản lý khuyến mãi | FR-41 |
| Nhân viên pha chế (BARISTA) | Đăng nhập, đăng xuất | FR-02, FR-03 |
| Nhân viên pha chế (BARISTA) | Xem danh sách đơn cần pha chế | FR-34 |
| Nhân viên pha chế (BARISTA) | Cập nhật trạng thái đơn hàng | FR-35 |
| Hệ thống | Xác thực và phân quyền theo vai trò, từ chối truy cập trái quyền (403) | FR-04 |

## 3. Yêu cầu chức năng

### 3.1 Xác thực và phân quyền

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-01 | Cho phép người dùng đăng ký tài khoản bằng email và mật khẩu. Tài khoản mới được gán vai trò CUSTOMER. | Must | AC1. Email chưa được sử dụng và mật khẩu hợp lệ thì đăng ký thành công.<br>AC2. Email đã tồn tại thì hệ thống báo lỗi và không tạo tài khoản.<br>AC3. Email sai định dạng hoặc mật khẩu rỗng thì không cho gửi form.<br>AC4. API không trả về mật khẩu của người dùng. |
| FR-02 | Đăng nhập bằng email và mật khẩu, cấp JWT và điều hướng theo vai trò. | Must | AC1. Thông tin hợp lệ thì đăng nhập thành công. CUSTOMER được chuyển đến menu, BARISTA đến trang nhân viên, ADMIN đến trang quản trị.<br>AC2. Email hoặc mật khẩu không đúng thì thông báo sai thông tin đăng nhập.<br>AC3. Token hết hạn hoặc không hợp lệ thì API trả 401. |
| FR-03 | Cho phép đăng xuất và vô hiệu hóa token cũ. | Must | AC1. Khi đăng xuất, token được xóa khỏi giao diện và người dùng trở về trạng thái chưa đăng nhập.<br>AC2. Token cũ không thể tiếp tục gọi API yêu cầu xác thực, trả 401 thông qua việc tăng `tokenVersion`. |
| FR-04 | Kiểm soát quyền truy cập theo vai trò. | Must | AC1. CUSTOMER truy cập API `/barista` hoặc `/admin` thì nhận 403.<br>AC2. BARISTA truy cập API `/admin` thì nhận 403.<br>AC3. Người chưa đăng nhập truy cập trang yêu cầu xác thực sẽ được chuyển đến trang đăng nhập.<br>AC4. Người không đủ quyền được hiển thị trang 403. |

### 3.2 Thực đơn

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-05 | Hiển thị danh sách đồ uống gồm ảnh, tên, danh mục, giá và nút thêm vào giỏ. | Must | AC1. Trang menu lấy danh sách sản phẩm từ `GET /products`.<br>AC2. Mỗi sản phẩm có ảnh, tên và giá hiển thị theo VND, ví dụ 35.000đ.<br>AC3. Sản phẩm thiếu ảnh được hiển thị bằng ảnh thay thế.<br>AC4. Khi không kết nối được backend, trang hiển thị thông báo lỗi thay vì để trắng. |
| FR-06 | Lọc đồ uống theo danh mục. | Must | AC1. Chọn danh mục "Cà phê" thì chỉ hiển thị các sản phẩm thuộc danh mục này.<br>AC2. Chọn "Tất cả" thì hiển thị toàn bộ sản phẩm.<br>AC3. Danh mục không có sản phẩm thì thông báo chưa có món. |
| FR-07 | Tìm kiếm đồ uống theo tên. | Must | AC1. Nhập một phần tên sản phẩm thì hiển thị các kết quả phù hợp, không phân biệt chữ hoa và chữ thường.<br>AC2. Không tìm thấy sản phẩm thì hiển thị thông báo.<br>AC3. Xóa từ khóa thì danh sách trở lại như ban đầu. |
| FR-08 | Sắp xếp sản phẩm, mặc định theo số lượng bán chạy. | Should | AC1. Sản phẩm được sắp xếp theo `soldCount` giảm dần.<br>AC2. Khi chọn cách sắp xếp khác, chẳng hạn theo giá, danh sách được cập nhật đúng thứ tự. |

### 3.3 Chi tiết sản phẩm

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-09 | Hiển thị thông tin chi tiết của sản phẩm. | Must | AC1. Truy cập `/products/:id` hợp lệ thì hiển thị tên, ảnh, giá, size và topping.<br>AC2. Nếu sản phẩm không tồn tại, hệ thống thông báo không tìm thấy. |
| FR-10 | Cho phép chọn size S, M, L và cập nhật giá theo BR-01. | Must | AC1. Sản phẩm giá gốc 30.000đ có giá size S là 24.000đ, M là 30.000đ và L là 36.000đ.<br>AC2. Khi đổi size, giá được cập nhật ngay mà không cần tải lại trang.<br>AC3. Size M được chọn mặc định. |
| FR-11 | Cho phép chọn topping và tính giá theo topping đã chọn. | Must | AC1. Danh sách topping lấy từ bảng `Topping` của backend.<br>AC2. Chọn topping thì giá món tăng tương ứng.<br>AC3. Bỏ chọn topping thì giá giảm đúng số tiền topping đó.<br>AC4. Topping có `stock = 0` không thể chọn. |

### 3.4 Giỏ hàng

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-12 | Thêm sản phẩm đã chọn size và topping vào giỏ hàng. | Must | AC1. Bấm "Thêm vào giỏ hàng" thì sản phẩm được thêm với đúng size, topping và giá.<br>AC2. Thêm lại sản phẩm có cùng size và topping thì tăng số lượng thêm 1.<br>AC3. Cùng sản phẩm nhưng khác size được lưu thành dòng riêng. |
| FR-13 | Thay đổi số lượng và xóa sản phẩm khỏi giỏ. | Must | AC1. Khi tăng hoặc giảm số lượng, thành tiền được tính lại.<br>AC2. Giảm số lượng về 0 thì sản phẩm bị xóa khỏi giỏ.<br>AC3. Giỏ trống có thông báo và không cho phép đặt hàng. |
| FR-14 | Hiển thị tiền nước, phí giao hàng, giảm giá và tổng thanh toán theo BR-02 đến BR-04. | Must | AC1. Đơn chưa đạt ngưỡng miễn phí giao hàng thì phí giao là 15.000đ.<br>AC2. Đơn đạt ngưỡng thì phí giao là 0đ.<br>AC3. Giỏ trống không tính phí giao hàng.<br>AC4. Tổng tiền hiển thị đúng với kết quả `POST /checkout/preview`. |
| FR-15 | Hiển thị số lượng sản phẩm trong giỏ trên Header. | Should | AC1. Thêm một ly thì số lượng trên Header tăng 1.<br>AC2. Số hiển thị là tổng số ly, không phải số dòng sản phẩm.<br>AC3. Giỏ trống thì số lượng bằng 0. |
| FR-16 | Giữ lại giỏ hàng khi tải lại trang. | Could | AC1. Sau khi thêm sản phẩm và nhấn F5, giỏ vẫn giữ đúng dữ liệu.<br>AC2. Khi đặt hàng thành công, giỏ hàng được xóa. |

### 3.5 Khuyến mãi và điểm thưởng

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-17 | Áp dụng mã khuyến mãi theo BR-06. | Should | AC1. Mã hợp lệ và đơn đủ điều kiện thì hệ thống tính đúng số tiền giảm.<br>AC2. Mã không tồn tại, bị tắt, chưa đến `startAt` hoặc quá `expiredAt` thì không áp dụng.<br>AC3. Đơn chưa đạt `minOrder` thì thông báo mức tối thiểu cần đạt.<br>AC4. Mã đã đạt `usageLimit` thì báo hết lượt sử dụng.<br>AC5. Tài khoản đã sử dụng mã trước đó không được dùng lại. |
| FR-18 | Tự gỡ mã khi đơn không còn đủ điều kiện. | Should | AC1. Khi giảm số lượng làm tiền nước thấp hơn `minOrder`, mã khuyến mãi được gỡ và tổng tiền được tính lại.<br>AC2. Người dùng chủ động gỡ mã thì tiền giảm trở về 0. |
| FR-19 | Cộng điểm thưởng cho đơn hàng. | Could | AC1. Đơn có tạm tính 50.000đ được cộng 50 điểm theo quy tắc 1 điểm cho mỗi 1.000đ, làm tròn xuống. **[Cần xác nhận quy tắc và thời điểm cộng điểm]**<br>AC2. Mỗi lần cộng điểm được lưu vào `LoyaltyTransaction` kèm lý do.<br>AC3. `GET /users/me/loyalty` trả đúng số điểm hiện có. |
| FR-20 | Sử dụng điểm thưởng để giảm tiền thanh toán. | Could | AC1. Người dùng được sử dụng điểm trong giới hạn số điểm đang có. Tiền giảm tính theo số điểm nhân với giá trị quy đổi.<br>AC2. Không cho phép dùng nhiều điểm hơn số điểm hiện có.<br>AC3. Điểm dùng cho đơn đang chờ thanh toán được giữ trong `reservedPoints`. Khi đơn bị hủy, số điểm này được trả lại. |

### 3.6 Đặt hàng

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-21 | Cho phép khách xem trước thông tin đơn hàng. | Must | AC1. `POST /checkout/preview` trả về tạm tính, phí giao, giảm giá và tổng tiền theo BR-01 đến BR-04.<br>AC2. Giỏ chứa sản phẩm không tồn tại hoặc đã bị xóa thì trả thông báo lỗi.<br>AC3. Người dùng phải đăng nhập mới gọi được API. |
| FR-22 | Tạo đơn hàng với thông tin người nhận. | Must | AC1. Nhập đủ tên, số điện thoại và địa chỉ thì tạo đơn `PENDING` và trả về mã đơn.<br>AC2. Thiếu thông tin hoặc số điện thoại sai định dạng thì không tạo đơn.<br>AC3. Backend tự tính lại `unitPrice` và `lineTotal`, không sử dụng giá do frontend gửi lên.<br>AC4. Không cho phép tạo đơn khi giỏ trống. |
| FR-23 | Giữ chỗ nguyên liệu, topping và điểm thưởng nếu có khi tạo đơn. | Must | AC1. `reservedQuantity` tăng đúng theo công thức, size và số lượng món.<br>AC2. Nếu tồn khả dụng không đủ, hệ thống từ chối tạo đơn và thông báo nguyên liệu hoặc topping bị thiếu.<br>AC3. Tạo đơn thất bại thì dữ liệu giữ chỗ không thay đổi. |
| FR-24 | Tự hủy đơn `PENDING` quá 10 phút theo BR-05. | Must | AC1. Đơn chưa thanh toán quá 10 phút được chuyển sang `CANCELLED` ở lần chạy tác vụ định kỳ tiếp theo.<br>AC2. Nguyên liệu, topping và điểm đã giữ chỗ được trả lại.<br>AC3. Đơn `PAID` không bị tự hủy. |
| FR-25 | Khách hàng hủy đơn của mình khi trạng thái còn cho phép. | Must | AC1. Đơn `PENDING` được hủy và chuyển sang `CANCELLED`, đồng thời trả lại phần giữ chỗ.<br>AC2. Đơn `PREPARING`, `READY`, `COMPLETED` không thể hủy. **[Cần xác nhận: có cho phép hủy đơn `PAID` chưa chế biến hay không]**<br>AC3. Khách không được hủy đơn của tài khoản khác, API trả 403 hoặc 404. |

### 3.7 Thanh toán

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-26 | Tạo yêu cầu thanh toán VNPay cho đơn `PENDING`. | Must | AC1. `POST /payments` tạo bản ghi `Payment` trạng thái `PENDING` với số tiền bằng tổng đơn và trả về URL thanh toán.<br>AC2. Đơn không thuộc người dùng hoặc không còn `PENDING` thì bị từ chối.<br>AC3. URL thanh toán có chữ ký hợp lệ theo cấu hình VNPay. |
| FR-27 | Xử lý kết quả khi khách quay lại từ VNPay. | Must | AC1. Thanh toán thành công thì hiển thị trang kết quả cùng mã đơn.<br>AC2. Thanh toán thất bại hoặc bị hủy thì thông báo và cho phép quay lại giỏ hoặc thanh toán lại.<br>AC3. Tham số có chữ ký không hợp lệ không được làm thay đổi trạng thái đơn. |
| FR-28 | Nhận IPN từ VNPay và cập nhật thanh toán. | Must | AC1. IPN thành công, chữ ký và số tiền hợp lệ thì `Payment` chuyển sang `SUCCEEDED`, đơn chuyển sang `PAID`. Nếu dùng khuyến mãi thì ghi nhận `PromotionUsage`.<br>AC2. IPN sai chữ ký thì trả mã lỗi và không cập nhật dữ liệu.<br>AC3. IPN thất bại thì `Payment` thành `FAILED`, đơn thành `PAYMENT_FAILED`.<br>AC4. Số tiền IPN khác tổng đơn thì từ chối xử lý. |
| FR-29 | Ngăn việc ghi nhận thanh toán nhiều lần. | Must | AC1. Gửi `POST /payments` hai lần với cùng `idempotencyKey` chỉ tạo một bản ghi `Payment`.<br>AC2. Khi VNPay gửi lại IPN của cùng giao dịch, hệ thống không cộng điểm hoặc ghi lượt sử dụng khuyến mãi thêm lần nữa. |
| FR-30 | Cho phép hủy thanh toán đang chờ. | Should | AC1. `POST /payments/orders/:orderId/cancel` hủy thanh toán `PENDING`, sau đó đơn được phép thanh toán lại hoặc bị hủy.<br>AC2. Thanh toán `SUCCEEDED` không được hủy bằng chức năng này. |

### 3.8 Lịch sử đơn hàng

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-31 | Hiển thị các đơn hàng của khách. | Must | AC1. `GET /orders/me` chỉ trả về đơn của tài khoản đang đăng nhập.<br>AC2. Trang `/orders` có tab "Đang xử lý" gồm `PENDING`, `PAID`, `PREPARING`, `READY` và tab "Lịch sử" gồm `COMPLETED`, `CANCELLED`, `PAYMENT_FAILED`.<br>AC3. Mỗi đơn có mã đơn, thời gian, trạng thái và tổng tiền.<br>AC4. Nếu chưa có đơn, hệ thống hiển thị thông báo. |
| FR-32 | Xem chi tiết đơn hàng đã đặt. | Should | AC1. Hiển thị tên món, size, topping, số lượng, thành tiền, tạm tính, phí giao, giảm giá, tổng tiền và thông tin người nhận.<br>AC2. Các số liệu phải khớp với dữ liệu được lưu khi đặt hàng. |
| FR-33 | Thanh toán lại đơn `PENDING` chưa quá hạn. | Could | AC1. Đơn còn thời hạn thanh toán có nút chuyển sang VNPay.<br>AC2. Đơn đã quá hạn hoặc bị hủy không hiển thị nút thanh toán. |

### 3.9 Quản lý trạng thái đơn và kho

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-34 | Nhân viên Barista xem các đơn cần chế biến. | Must | AC1. `GET /barista/orders` trả về các đơn đã thanh toán nhưng chưa hoàn tất.<br>AC2. Danh sách hiển thị món, size, topping, số lượng và thời gian đặt.<br>AC3. Đơn `PENDING` không xuất hiện trong danh sách.<br>AC4. Chỉ BARISTA hoặc ADMIN được truy cập. |
| FR-35 | Barista cập nhật trạng thái chế biến đơn hàng. | Must | AC1. `PATCH /barista/orders/:id` cho phép chuyển lần lượt `PAID` → `PREPARING` → `READY` → `COMPLETED`.<br>AC2. Không cho phép bỏ qua bước hoặc chuyển ngược trạng thái.<br>AC3. Đơn `COMPLETED` hoặc `CANCELLED` không được cập nhật tiếp.<br>AC4. Khách hàng xem được trạng thái mới sau khi cập nhật. |
| FR-36 | Trừ nguyên liệu và topping khi đơn thanh toán thành công. | Must | AC1. Món cần 20g cà phê, đặt 2 ly size L thì khi đơn chuyển sang `PAID`, kho giảm 20 × 1,2 × 2 = 48g.<br>AC2. Phần nguyên liệu giữ chỗ được giải phóng và không bị trừ hai lần.<br>AC3. `stock` của topping giảm đúng số lượng sử dụng.<br>AC4. Nếu đơn bị hủy trước khi thanh toán thì tồn kho không đổi. |

### 3.10 Quản trị hệ thống

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-37 | Admin thêm, sửa và xóa sản phẩm. | Must | AC1. Thêm sản phẩm với tên, giá, danh mục và ảnh hợp lệ thì sản phẩm xuất hiện trên menu.<br>AC2. Khi sửa tên hoặc giá, menu hiển thị dữ liệu mới.<br>AC3. Xóa sản phẩm thì sản phẩm không còn trong menu nhưng vẫn xem được các đơn cũ.<br>AC4. Từ chối sản phẩm có tên rỗng hoặc giá âm.<br>AC5. Người không có vai trò ADMIN nhận 403. |
| FR-38 | Quản lý nguyên liệu và nhập kho. | Must | AC1. Admin tạo được nguyên liệu với tên, đơn vị và tồn ban đầu.<br>AC2. `POST /admin/ingredients/:id/import` với số lượng dương làm tồn kho tăng tương ứng.<br>AC3. Số lượng nhập bằng 0 hoặc âm bị từ chối. |
| FR-39 | Quản lý topping và nhập kho topping. | Must | AC1. Admin tạo topping với tên, giá và tồn kho.<br>AC2. `POST /admin/toppings/:id/import` làm tăng tồn kho đúng số lượng nhập.<br>AC3. Số lượng nhập không hợp lệ bị từ chối. |
| FR-40 | Xem tồn kho nguyên liệu và topping. | Must | AC1. `GET /admin/inventory` hiển thị tồn kho, số lượng giữ chỗ và đơn vị của nguyên liệu, topping.<br>AC2. Các mục sắp hết hàng được làm nổi bật.|
| FR-41 | Quản lý mã khuyến mãi. | Should | AC1. Tạo mã với giá trị giảm, loại giảm, đơn tối thiểu, thời gian hiệu lực và giới hạn lượt sử dụng.<br>AC2. Không cho phép tạo mã trùng.<br>AC3. Xóa mã bằng cách đặt `active = false`, giữ lại lịch sử sử dụng.<br>AC4. Mã sau khi chỉnh sửa được áp dụng cho các đơn tiếp theo. |
| FR-42 | Xem báo cáo doanh thu. | Should | AC1. `GET /admin/reports/revenue` trả về doanh thu trong khoảng thời gian được chọn.<br>AC2. Chỉ tính đơn đã thanh toán, không tính đơn `CANCELLED` và `PAYMENT_FAILED`.<br>AC3. Doanh thu phải khớp với tổng các đơn hợp lệ trong khoảng thời gian đó. |
| FR-43 | Xem danh sách đơn của toàn bộ khách hàng. | Should | AC1. Admin xem và lọc đơn theo trạng thái.<br>AC2. Mỗi đơn hiển thị mã, khách hàng, tổng tiền, trạng thái và thời gian. |
| FR-44 | Hiển thị trang "Về chúng tôi". | Could | AC1. Trang `/about` có địa chỉ Quận 5, TP.HCM, giờ mở cửa 7:00–22:00, số điện thoại và email.<br>AC2. Có thể mở trang từ Header mà không cần đăng nhập. |

### 3.11 Chức năng ngoài phạm vi

Các chức năng dưới đây không được triển khai và kiểm thử trong phạm vi đồ án hiện tại.

| Mã | Yêu cầu | Ưu tiên | Ghi chú |
|---|---|---|---|
| FR-45 | Thanh toán tiền mặt (COD) và ví điện tử khác | Won't | BrewLite chỉ sử dụng VNPay |
| FR-46 | Ứng dụng iOS/Android | Won't | Chỉ phát triển website responsive |
| FR-47 | Theo dõi shipper theo thời gian thực và tích hợp đơn vị vận chuyển | Won't | Không nằm trong nguồn lực hiện tại |
| FR-48 | Đánh giá và bình luận sản phẩm | Won't | Không thuộc yêu cầu đồ án |
| FR-49 | Thông báo đẩy, SMS và email giao dịch | Won't | Không thuộc yêu cầu đồ án |
| FR-50 | Hoàn tiền tự động qua VNPay | Won't|  `PaymentStatus` có `REFUNDED` nhưng chưa triển khai luồng hoàn tiền |

## 4. Yêu cầu phi chức năng

Các chỉ tiêu hiệu năng dưới đây được đề xuất cho môi trường demo trên máy cá nhân, với dữ liệu mẫu khoảng vài chục sản phẩm. 

### 4.1 Hiệu năng

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-01 | Thời gian tải trang menu. | Must | AC1. Với 50 sản phẩm, trang menu hiển thị đầy đủ trong tối đa 3 giây khi tải lần đầu trên mạng thông thường, đo bằng thẻ Network của trình duyệt.<br>AC2. Mỗi ảnh sản phẩm không vượt quá 500 KB. |
| NFR-02 | Thời gian phản hồi API đọc dữ liệu. | Should | AC1. `GET /products` và `GET /orders/me` có thời gian phản hồi trung vị dưới 500 ms với 20 người dùng đồng thời, kiểm tra bằng k6 hoặc Postman runner.<br>AC2. Không xuất hiện truy vấn N+1 khi lấy danh sách sản phẩm và topping. |
| NFR-03 | Thời gian tạo đơn hàng. | Should | AC1. `POST /orders` xử lý trong tối đa 2 giây với giỏ hàng gồm 10 món, không tính thời gian thanh toán tại VNPay. |

### 4.2 Bảo mật

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-04 | Mật khẩu phải được băm trước khi lưu. | Must | AC1. Trường `passwordHash` không chứa mật khẩu gốc.<br>AC2. Hai tài khoản có cùng mật khẩu vẫn có giá trị băm khác nhau nhờ salt. |
| NFR-05 | Kiểm tra token và quyền truy cập API. | Must | AC1. API yêu cầu đăng nhập trả 401 nếu không có token.<br>AC2. Người dùng không đủ quyền nhận 403.<br>AC3. Mỗi API ở mục 3 có ít nhất một ca kiểm thử quyền truy cập. |
| NFR-06 | Bảo vệ dữ liệu đơn hàng của khách. | Must | AC1. Khách A không thể xem, hủy hoặc thanh toán đơn của khách B.<br>AC2. Danh sách đơn chỉ chứa dữ liệu của tài khoản đang đăng nhập. |
| NFR-07 | Kiểm tra dữ liệu trả về từ VNPay. | Must | AC1. Return URL và IPN đều phải được xác minh chữ ký trước khi xử lý.<br>AC2. Yêu cầu giả mạo không được làm thay đổi trạng thái đơn hoặc thanh toán. |
| NFR-08 | Bảo vệ thông tin cấu hình. | Must | AC1. File `.env` nằm trong `.gitignore` và không xuất hiện trong lịch sử commit.<br>AC2. Khóa JWT và VNPay được lấy từ biến môi trường, không ghi trực tiếp trong mã nguồn. |
| NFR-09 | Kiểm tra dữ liệu đầu vào tại backend. | Must | AC1. Dữ liệu thiếu trường bắt buộc, sai kiểu hoặc chứa số âm không hợp lệ thì API trả 400 kèm thông báo.<br>AC2. Backend tự tính giá và tổng tiền, không sử dụng giá do client gửi. |

### 4.3 Toàn vẹn dữ liệu và độ tin cậy

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-10 | Các thao tác liên quan đến nhiều dữ liệu phải dùng transaction. | Must | AC1. Tạo đơn, giữ chỗ kho, ghi lượt dùng mã và trừ điểm phải cùng thành công hoặc cùng rollback.<br>AC2. Khi xảy ra lỗi giữa chừng, dữ liệu không bị cập nhật một phần. |
| NFR-11 | Không để tồn kho âm khi nhiều khách đặt cùng lúc. | Must | AC1. Nếu nguyên liệu chỉ đủ cho một ly mà có hai yêu cầu đặt đồng thời, chỉ một đơn được tạo thành công.<br>AC2. Sau kiểm thử, tồn kho và số lượng giữ chỗ không âm. |
| NFR-12 | Tác vụ hủy đơn quá hạn hoạt động ổn định. | Must | AC1. Tác vụ chạy mỗi phút, không phát sinh lỗi trong log khi cơ sở dữ liệu đúng schema.<br>AC2. Nếu một lần chạy bị lỗi, tác vụ vẫn tiếp tục ở lần chạy sau. |

### 4.4 Tính khả dụng

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-13 | Giao diện responsive. | Must | AC1. Giao diện không tràn ngang ở các kích thước 360px, 768px và 1440px.<br>AC2. Nút bấm chính trên điện thoại có vùng chạm tối thiểu khoảng 40px. |
| NFR-14 | Giao diện tiếng Việt và hiển thị tiền VND. | Must | AC1. Nhãn và thông báo sử dụng tiếng Việt.<br>AC2. Giá tiền có dấu chấm phân cách hàng nghìn và ký hiệu đ, ví dụ 35.000đ. |
| NFR-15 | Hiển thị thông báo lỗi rõ ràng. | Must | AC1. Các lỗi như sai mật khẩu, hết hàng, mã giảm giá không hợp lệ hoặc mất kết nối phải có thông báo nêu nguyên nhân và hướng xử lý.<br>AC2. Không hiển thị stack trace hoặc mã lỗi kỹ thuật cho khách hàng. |
| NFR-16 | Giao diện bám theo thiết kế Figma. | Should | AC1. Màu nền `#F8F5F0`, bố cục rộng 1440px, phông chữ và khoảng cách của các trang chính được đối chiếu với Figma.<br>AC2. Thành viên review giao diện trước khi gộp Pull Request. |
| NFR-17 | Có thông báo khi đang tải hoặc không có dữ liệu. | Should | AC1. Khi chờ backend trả dữ liệu, giao diện hiển thị trạng thái đang tải.<br>AC2. Giỏ hàng, danh sách đơn hoặc kết quả tìm kiếm rỗng đều có thông báo. |
| NFR-18 | Hỗ trợ các trình duyệt phổ biến. | Should | AC1. Website hoạt động đúng trên phiên bản mới của Chrome, Edge và Firefox. |

### 4.5 Triển khai và bảo trì

| Mã | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-19 | Khởi tạo môi trường bằng Docker. | Should | AC1. Trên máy có Docker, thực hiện theo README thì PostgreSQL khởi động được.<br>AC2. Không cần cài thêm thành phần ngoài hướng dẫn trong README. |
| NFR-20 | Quản lý cấu hình bằng biến môi trường. | Must | AC1. Repository có `.env.example` chứa các biến cần thiết cho PostgreSQL, JWT, VNPay và backend.<br>AC2. Khi thay đổi cấu hình, chỉ cần chỉnh `.env` mà không phải sửa mã nguồn. |
| NFR-21 | Khởi tạo cơ sở dữ liệu và dữ liệu mẫu. | Must | AC1. Chạy migration và seed trên cơ sở dữ liệu trống sẽ tạo đủ sản phẩm, topping, nguyên liệu, công thức và tài khoản mẫu cho CUSTOMER, BARISTA, ADMIN.<br>AC2. Migration chạy theo README không phát sinh lỗi drift. |
| NFR-22 | Frontend và backend build không có lỗi. | Must | AC1. Cả hai phần không có lỗi TypeScript khi build.<br>AC2. Không gộp mã nguồn vào `main` khi build chưa thành công. |
| NFR-23 | Có tài liệu API. | Should | AC1. Swagger tại `/api` hiển thị các endpoint trong mục 3 cùng dữ liệu đầu vào và đầu ra. |
| NFR-24 | Thực hiện đúng quy trình Git của nhóm. | Should | AC1. Mỗi chức năng phát triển trên nhánh `feature/<tên-chức-năng>`, commit theo mẫu `feat(<mô-đun>): mô tả` và tạo Pull Request để review.<br>AC2. Không commit `node_modules` hoặc `.env`. |

## 5. Mức độ ưu tiên MoSCoW

| Mức | Ý nghĩa | Các nhóm chức năng |
|---|---|---|
| Must | Các yêu cầu cần hoàn thành trong MVP | Đăng nhập, phân quyền, menu, chi tiết sản phẩm, giỏ hàng, đặt hàng, thanh toán VNPay, lịch sử đơn, Barista, quản lý sản phẩm và kho, bảo mật và toàn vẹn dữ liệu |
| Should | Ưu tiên thực hiện sau khi hoàn thành MVP | Sắp xếp sản phẩm, hiển thị số lượng giỏ, khuyến mãi, hủy thanh toán, chi tiết đơn, báo cáo doanh thu, hiệu năng, Docker và Swagger |
| Could | Thực hiện nếu nhóm còn thời gian | Lưu giỏ hàng, tích điểm, dùng điểm, thanh toán lại và trang "Về chúng tôi" |
| Won't | Không thực hiện trong đồ án | COD, ứng dụng di động, theo dõi shipper, đánh giá sản phẩm, thông báo và hoàn tiền tự động |
