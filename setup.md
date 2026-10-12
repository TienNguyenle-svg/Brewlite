SETUP - HƯỚNG DẪN CÀI ĐẶT BREWLITE

Mục đích: dành cho thành viên mới clone repo về máy và chạy được dự án.

1. Cài các công cụ cần thiết
- Node.js (>= 20): tải tại https://nodejs.org
- Git: tải tại https://git-scm.com
- Docker Desktop: tải tại https://www.docker.com/products/docker-desktop
- VS Code

Trên VS Code tải các Extensions sau (nếu chưa có):
ESLint, Prettier, Prisma, Tailwind CSS IntelliSense, GitLens, Error Lens

Sau khi cài, mở CMD mới và kiểm tra:
`node -v`
`npm -v`
`git --version`
`docker --version`

Nếu cả 4 hiện version là OK.

2. Cài pnpm
Dự án ko yêu cầu cụ thể npm hay pnpm nên mình dùng pnpm cho nhẹ hơn, không dùng npm.
`npm i -g pnpm`
Kiểm tra:
`pnpm --version`

3. Clone repo
`cd Desktop`
`git clone https://github.com/TienNguyenle-svg/Brewlite.git`
`cd Brewlite`


4. Cài dependencies backend
`cd backend`
`pnpm install`
Lệnh này tạo thư mục node_modules từ file pnpm-lock.yaml.

5. Tạo file .env cho backend
`copy ..\.env.example .env`

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
`cd ..`
`docker-compose up -d postgres`

Kiểm tra:
`docker ps`
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
`curl http://localhost:3001/products`
Phải thấy 4 sản phẩm.

10. Cài dependencies frontend
Mở terminal mới (giữ backend đang chạy).
`cd Desktop\Brewlite\frontend`
`pnpm install`
`pnpm add @tanstack/react-query zustand axios`

Lệnh này tạo node_modules cho frontend và cài thêm 3 thư viện:
- @tanstack/react-query: gọi API, cache dữ liệu
- zustand: quản lý state giỏ hàng
- axios: HTTP client

11. Tạo file .env.local cho frontend
`notepad .env.local`

Dán nội dung:
NEXT_PUBLIC_API_URL=http://localhost:3001

Lưu lại và đóng.

12. Chạy frontend
`pnpm dev`
Phải thấy dòng:
▲ Next.js 16.4.0
- Local: http://localhost:3000

Mở browser: http://localhost:3000
Phải thấy trang mặc định Next.js.

12. Lỗi thường gặp
- 'node' is not recognized: chưa cài Node.js, cài lại và tick Add to PATH.
- 'pnpm' is not recognized: chưa cài pnpm, chạy npm i -g pnpm.
- ECONNREFUSED: backend chưa chạy, chạy pnpm start:dev.
- P1001 Can't reach database: Docker chưa chạy, mở Docker Desktop và chạy docker-compose up -d postgres.
- Environment variable not found DATABASE_URL: chưa tạo .env, chạy copy .env.example .env.
- Cannot find module '@prisma/client': chưa cài deps, chạy pnpm install.
- port 3001 already in use: port bị chiếm, tắt process cũ hoặc đổi PORT trong .env.

13. Quy trình làm việc nhóm

## 1. Quy tắc đặt tên branch và commit

### Tên branch

- Thêm chức năng: `feature/<tên-chức-năng>`
  - Ví dụ: `feature/user-auth`, `feature/payment-vnpay`
- Sửa lỗi: `bugfix/<tên-lỗi>`
  - Ví dụ: `bugfix/fix-login-error`

### Tên commit (Conventional Commits)

- `feat:` cho chức năng hoặc giao diện mới
  - Ví dụ: `feat(user): add login form validation`
- `fix:` cho sửa lỗi
  - Ví dụ: `fix(cart): resolve total amount calculation bug`
- `chore:` cho cấu hình, tài liệu hoặc database
  - Ví dụ: `chore(docs): update API docs`

## 2. Quy trình 5 bước push code theo chức năng

Mỗi khi muốn push một chức năng mới lên Git, hãy thực hiện đúng 5 bước sau:

```bash

# Bước 1: Lấy code mới nhất từ main về máy local
git checkout main
git pull origin main

# Bước 2: Tạo branch mới cho chức năng muốn push
git checkout -b feature/<tên-chức-năng>

# Bước 3: Chỉ add các file hoặc thư mục thuộc chức năng đó
git add <đường-dẫn-file-hoặc-folder-chức-năng>

# Bước 4: Kiểm tra lại, đảm bảo không add nhầm node_modules hoặc file khác
git status

# Bước 5: Commit và push branch lên GitHub
git commit -m "feat(<tên-mô-đun>): mô tả ngắn gọn chức năng"
git push -u origin feature/<tên-chức-năng>
```

Lưu ý: Sau khi push code xong thì vào github và pull request ngay!!!