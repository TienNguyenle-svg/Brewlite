# Ma trận truy vết yêu cầu BrewLite

Ma trận dùng mã FR và User Story theo [mẫu Assignment SGU](../Assigment_template_SGU.pdf), rồi đối chiếu giao diện, API và test có trong repository. Các đường dẫn dưới đây là vị trí mã nguồn, không khẳng định mọi tiêu chí chấp nhận của mẫu đã được triển khai.

## Danh mục sơ đồ

| Mã | Sơ đồ / nguồn |
|---|---|
| D-UC | Sơ đồ Use Case trong [report/Assignment2-BrewLite.pdf](../report/Assignment2-BrewLite.pdf) |
| D-ER | ERD trong [report/BrewLite-CongNghePhanMem.pdf](../report/BrewLite-CongNghePhanMem.pdf), đối chiếu với `backend/prisma/schema.prisma` |
| D-SM | Order State Machine trong [README](../README.md) và logic trạng thái backend |
| D-ACT-B | Activity Barista tại [activity-barista.puml](./diagrams/activity-barista.puml) |
| D-ACT-A | Activity Admin tại [activity-admin.puml](./diagrams/activity-admin.puml) |

## Yêu cầu chức năng

| ID mẫu | Yêu cầu | Giao diện / mã Frontend | API / mã Backend | Test backend trong repository |
|---|---|---|---|---|
| FR-01 | Hiển thị menu: danh sách, lọc/tìm kiếm, giá, trạng thái còn hàng và lỗi tải | `frontend/app/page.tsx`, `frontend/components/MenuSection.tsx`, `frontend/components/ProductCard.tsx` | `GET /products`; `backend/src/products/` | `products.controller.spec.ts`, `products.service.spec.ts` |
| FR-02 | Xem chi tiết, chọn size/topping và cập nhật giá | `frontend/app/products/[id]/page.tsx`, `frontend/components/ProductDetailView.tsx` | `GET /products/:id`; `backend/src/products/` | `products.controller.spec.ts`, `products.service.spec.ts` |
| FR-03 | Quản lý giỏ hàng và xem chi phí/khuyến mãi/điểm trước checkout | `frontend/lib/cart-store.ts`, `frontend/components/cart/`, `frontend/components/checkout/` | `POST /checkout/preview`; `backend/src/discounts/` | `checkout.controller.spec.ts`, `discounts.service.spec.ts`, `order-pricing.spec.ts` |
| FR-04 | Đăng ký/đăng nhập, JWT và phân quyền CUSTOMER/BARISTA/ADMIN | `frontend/app/login/`, `frontend/app/register/`, `frontend/components/auth/` | `/auth/register`, `/auth/login`, `/auth/logout`; `backend/src/auth/` | `auth.controller.spec.ts`, `auth.service.spec.ts`, `jwt.strategy.spec.ts` |
| FR-05 | Tạo đơn, kiểm tra tồn kho, thanh toán VNPay, retry và hủy sau lỗi | `frontend/app/checkout/`, `frontend/components/checkout/`, `frontend/app/payment/result/` | `/orders`, `/payments`, `/payments/vnpay-return`, `/payments/vnpay-ipn`, `/payments/orders/:orderId/cancel` | `orders.service.spec.ts`, `orders.controller.spec.ts`, `payments.service.spec.ts`, `payments.controller.spec.ts` |
| FR-06 | Xác nhận đơn, xem lịch sử và khách hủy đơn PAID đủ điều kiện | `frontend/app/orders/`, `frontend/components/orders/OrdersView.tsx`, `frontend/app/payment/result/` | `GET /orders/me`, `PATCH /orders/:id/cancel` | `orders.service.spec.ts`, `orders.controller.spec.ts` |
| FR-07 | Barista xem hàng đợi và chuyển trạng thái theo đúng thứ tự | `frontend/app/barista/`, `frontend/components/barista/`, `frontend/lib/barista.ts` | `GET /barista/orders`, `PATCH /barista/orders/:id` | `barista.controller.spec.ts`, `barista.service.spec.ts` |
| FR-08 | Admin quản lý sản phẩm, kho, đơn hàng và báo cáo doanh thu | `frontend/app/admin/` | `/admin/products`, `/admin/inventory`, `/admin/orders`, `/admin/reports/revenue` | `admin.controller.spec.ts`, `admin.service.spec.ts`, `inventory.service.spec.ts` |

## User Story bổ sung trong mẫu

| User Story | Phạm vi | Đối chiếu repository |
|---|---|---|
| US-10 | State machine đơn hàng | Backend payments/orders và Barista; xem test orders, payments, barista và D-SM. |
| US-11 | Idempotency thanh toán | `backend/src/payments/`; test `payments.service.spec.ts` có kịch bản gửi lặp key. |
| US-12 | Chống overselling khi đặt đồng thời | `backend/src/orders/` và `backend/src/inventory/`; cần đối chiếu kết quả test tương ứng khi nghiệm thu. |
| US-13 | Khuyến mãi, checkout preview và loyalty | `backend/src/discounts/`, `backend/src/loyalty/`, `frontend/components/cart/`; test checkout, discounts và loyalty. |
| US-14–16 | Nghiệp vụ Barista và Admin | Đã ánh xạ trong FR-07 và FR-08. |
| US-17 | Đánh giá sản phẩm | Có trong mẫu Assignment; chưa tìm thấy mã triển khai hoặc test tương ứng trong repository. |
| US-18 | Email xác nhận mock sau thanh toán | Có trong mẫu Assignment; chưa tìm thấy mã triển khai hoặc test tương ứng trong repository. |

## Yêu cầu phi chức năng và kiểm thử

- Mẫu đặt mục tiêu API dưới 500 ms (NFR-01), nhưng repository chưa có benchmark để xác nhận.
- Backend có JWT, bcrypt, DTO validation và kiểm tra quyền theo module (NFR-02); đây là đối chiếu mã nguồn, không thay thế kiểm thử bảo mật.
- Chưa có kết quả kiểm thử đa trình duyệt (NFR-03). Mẫu yêu cầu giao diện có trạng thái tải/lỗi/rỗng và mô tả hàng đợi Barista polling mỗi 10 giây (NFR-04/05); các tiêu chí giao diện cần được kiểm tra khi nghiệm thu, polling không phải real-time/WebSocket.
- Repository có test backend dạng `*.spec.ts`; không tìm thấy bộ test tự động frontend. Báo cáo mẫu ghi 92 test case, nhưng ma trận này không xác nhận rằng toàn bộ 92 case đã được chạy hoặc pass từ trạng thái hiện tại của repository.
