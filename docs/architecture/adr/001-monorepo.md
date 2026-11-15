# ADR-001: Dùng một repository (monorepo) cho backend và frontend

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-14
- Người quyết định: Nhóm phát triển

## Bối cảnh

BrewLite gồm backend NestJS và frontend Next.js do nhiều thành viên làm song song, mỗi người một nhánh `feature/...`. Giao diện phụ thuộc chặt vào API (ví dụ `GET /products`, `POST /checkout/preview`). Nhóm cần một nơi duy nhất để review, theo dõi thay đổi và đặt tài liệu.

## Quyết định

Đặt cả hai ứng dụng trong một repository `Brewlite`: thư mục `backend/`, `frontend/`, và `docs/` ở gốc. Mỗi ứng dụng có `package.json` riêng và dùng pnpm. Chưa dùng công cụ quản lý monorepo (Nx, Turborepo).

## Phương án đã xét

| Phương án | Nhận xét |
|-----------|----------|
| Hai repository riêng | Độc lập hơn, nhưng thay đổi API và giao diện nằm ở hai PR, khó đồng bộ với nhóm nhỏ |
| Monorepo với Nx/Turborepo | Mạnh, nhưng thêm công cụ cần học, không cần cho quy mô này |
| **Monorepo thư mục đơn giản** | Đơn giản, đủ dùng |

## Hệ quả

- Tích cực: một PR có thể sửa cả API và giao diện; tài liệu và thiết kế ở một chỗ; quy ước Git áp dụng đồng nhất.
- Tiêu cực: dễ xung đột khi nhiều người sửa cùng file chung (đã gặp ở Header, layout); phải cẩn thận khi `git add` để không đưa `node_modules`, `.env` vào commit.
- Rủi ro: kiểu dữ liệu giữa frontend và backend phải giữ đồng bộ bằng tay (chưa có gói kiểu dùng chung).
- Quy ước đi kèm: pull `main` mới nhất, một chức năng một nhánh, chỉ `git add` file của chức năng đó.
