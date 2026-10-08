SETUP - HƯỚNG DẪN CÀI ĐẶT BREWLITE

Mục đích: dành cho thành viên mới clone repo về máy và chạy được dự án.

1. Cài các công cụ cần thiết
- Node.js (>= 20): tải tại https://nodejs.org
- Git: tải tại https://git-scm.com
- Docker Desktop: tải tại https://www.docker.com/products/docker-desktop
- VS Code:

Sau khi cài, mở CMD mới và kiểm tra:
node -v
npm -v
git --version
docker --version

Nếu cả 4 hiện version là OK.

2. Cài pnpm
Dự án ko yêu cầu cụ thể npm hay pnpm nên mình dùng pnpm cho nhẹ hơn, không dùng npm.
npm i -g pnpm
Kiểm tra:
pnpm --version

3. Clone repo
cd Desktop
git clone https://github.com/TienNguyenle-svg/Brewlite.git
cd Brewlite

Nếu đã clone rồi:
cd Desktop\Brewlite
git pull origin main

4. Cài dependencies backend
cd backend
pnpm install
Lệnh này tạo thư mục node_modules từ file pnpm-lock.yaml.

5. Tạo file .env cho backend
copy ..\.env.example .env

Nếu không có file .env.example, tạo thủ công:
notepad .env

Dán nội dung:
DATABASE_URL="postgresql://brewlite:brewlite123@localhost:5432/brewlite"
PORT=3001
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

Lưu lại và đóng.

6. Chạy database
Mở Docker Desktop trước, đợi icon cá voi chuyển xanh.
Sau đó chạy:
cd ..
docker-compose up -d postgres

Kiểm tra:
docker ps
Phải thấy container brewlite-db đang chạy.

7. Migrate database
`cd backend`
`pnpm prisma migrate dev`
Lệnh này tạo 5 bảng: Product, User, Order, OrderItem, Payment.

Kiểm tra:
`docker exec -it brewlite-db psql -U brewlite -d brewlite`
Trong giao diện psql, gõ:
`\dt`
Phải thấy 5 bảng. Thoát bằng:
`\q`

8. Seed dữ liệu mẫu
`pnpm prisma db seed`
Lệnh này thêm 4 sản phẩm mẫu vào database.

9. Chạy backend
`pnpm start:dev`
Phải thấy dòng:
Application is running on: http://localhost:3001

Test API:
curl http://localhost:3001/products
Phải thấy 4 sản phẩm.



12. Lỗi thường gặp
- 'node' is not recognized: chưa cài Node.js, cài lại và tick Add to PATH.
- 'pnpm' is not recognized: chưa cài pnpm, chạy npm i -g pnpm.
- ECONNREFUSED: backend chưa chạy, chạy pnpm start:dev.
- P1001 Can't reach database: Docker chưa chạy, mở Docker Desktop và chạy docker-compose up -d postgres.
- Environment variable not found DATABASE_URL: chưa tạo .env, chạy copy .env.example .env.
- Cannot find module '@prisma/client': chưa cài deps, chạy pnpm install.
- port 3001 already in use: port bị chiếm, tắt process cũ hoặc đổi PORT trong .env.

13. Quy trình làm việc nhóm
...