# Triển khai và rollback BrewLite

## Phạm vi và cảnh báo dữ liệu

Repository hiện có Docker Compose cho PostgreSQL, backend và frontend. Tài liệu này mô tả cách chạy/khôi phục cấu hình đó; mẫu bài tập có nhắc đến Render nhưng repository chưa có cấu hình Render để xác minh hoặc hướng dẫn triển khai dịch vụ đó.

**Compose hiện tại chỉ phù hợp môi trường phát triển/demo, không dùng nguyên trạng cho production.** Lệnh khởi động backend trong `docker-compose.yml` chạy `prisma migrate deploy`, sau đó chạy `prisma db seed`. Script seed hiện xóa dữ liệu đang có rồi tạo lại dữ liệu mẫu. Mỗi lần backend khởi động theo cấu hình này có thể làm mất toàn bộ dữ liệu ứng dụng.

Trước khi triển khai lên môi trường có dữ liệu thật:

1. Bỏ bước `prisma db seed` khỏi lệnh khởi động backend; chỉ seed thủ công trên database rỗng dùng cho phát triển/demo.
2. Cấu hình riêng và bảo vệ `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL` và `VNPAY_RETURN_URL`. Compose hiện tại còn đặt sẵn thông tin database và JWT mẫu trong file, chưa lấy các giá trị này từ secret store.
3. Giới hạn CORS theo domain frontend và chỉ mở các cổng cần thiết. `backend/src/main.ts` hiện cho phép mọi origin.
4. Sao lưu database và xác nhận kế hoạch khôi phục trước khi chạy migration.

Không chạy hướng dẫn khởi động/khôi phục bên dưới trên database production nếu Compose vẫn chạy seed tự động.

## Chạy môi trường demo

Chỉ chạy các lệnh dưới đây trên database dùng thử có thể bị làm mới. Nếu cần giữ dữ liệu, hãy bỏ bước seed khỏi lệnh khởi động backend trước; backup không ngăn seed xóa dữ liệu khi container khởi động.

1. Ghi lại commit/tag đang chạy và chọn phiên bản cần chạy.
2. Nếu cần giữ dữ liệu demo để khôi phục thủ công, sao lưu trước khi backend khởi động lại:

   ```powershell
   docker compose exec -T postgres pg_dump -U brewlite -d brewlite -Fc > brewlite-before-deploy.dump
   ```

3. Cập nhật mã nguồn rồi build và chạy các service:

   ```powershell
   docker compose up -d --build
   docker compose ps
   docker compose logs --tail 100 backend
   docker compose logs --tail 100 frontend
   ```

   Lưu ý: backend chạy migration và seed trong lệnh khởi động hiện tại; seed xóa dữ liệu cũ và không tự khôi phục từ backup.
4. Kiểm tra API/Swagger, đăng nhập, đặt hàng, callback thanh toán thành công/thất bại và trạng thái đơn. VNPay cần thông tin cấu hình hợp lệ; không đưa secret vào Git.

## Rollback ứng dụng

1. Ghi nhận lỗi, dừng phát hành tiếp theo và chọn commit/tag gần nhất đã xác nhận hoạt động.
2. Checkout phiên bản đó rồi build lại:

   ```powershell
   git fetch --tags
   git switch --detach <commit-hoac-tag-on-dinh>
   docker compose up -d --build
   docker compose ps
   docker compose logs --tail 100 backend
   ```

3. Xác nhận các luồng đọc menu, đăng nhập, tạo đơn, thanh toán và trạng thái đơn.

Rollback ứng dụng không tự động rollback schema. Chỉ quay ứng dụng về phiên bản cũ khi schema mới vẫn tương thích; không sửa/xóa migration đã áp dụng. Ưu tiên migration tiến (forward-fix) để giữ dữ liệu.

## Khôi phục database

Chỉ restore khi đã xác nhận đúng database và backup. Lệnh restore ghi đè dữ liệu hiện có. Trước khi thực hiện, dừng backend; trước khi khởi động lại, đảm bảo seed tự động đã được tắt nếu cần giữ dữ liệu vừa khôi phục.

```powershell
docker compose stop backend
docker cp .\brewlite-before-deploy.dump brewlite-db:/tmp/brewlite-before-deploy.dump
docker compose exec postgres pg_restore -U brewlite -d brewlite --clean --if-exists /tmp/brewlite-before-deploy.dump
```

Sau khi xác minh dữ liệu, xóa bản dump tạm trong container:

```powershell
docker compose exec postgres rm /tmp/brewlite-before-deploy.dump
```

Không dùng `docker compose down -v` để rollback: `-v` xóa volume database. Lưu backup ở nơi an toàn, giới hạn quyền truy cập và kiểm tra khả năng restore định kỳ.
