# ADR-003: Frontend dùng Next.js App Router, TypeScript, TailwindCSS và Zustand

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-14
- Người quyết định: Nhóm phát triển

## Bối cảnh

Giao diện gồm menu, chi tiết sản phẩm, giỏ hàng, đặt đơn, lịch sử đơn, đăng nhập và các trang quản trị. Giao diện phải bám thiết kế Figma và hiển thị tốt trên điện thoại (NFR-13, NFR-16). Đề bài yêu cầu Next.js, React, TypeScript và TailwindCSS.

## Quyết định

- **Next.js (App Router)** cho định tuyến theo thư mục và render phía server ở những trang cần (trang menu lấy sản phẩm ở server component); trang tương tác dùng client component (`"use client"`).
- **TypeScript** cho toàn bộ mã frontend.
- **TailwindCSS** để dựng giao diện theo Figma nhanh và nhất quán.
- **Zustand** cho trạng thái giỏ hàng (`useCartStore`, hook `useCart` tính tạm tính, phí giao, giảm giá, tổng).
- Một hàm `request` dùng chung trong `lib/api.ts` để gọi backend và chuẩn hóa lỗi (`ApiError`).

## Phương án đã xét

| Phương án | Nhận xét |
|-----------|----------|
| React SPA với Vite | Đơn giản hơn, nhưng không có render server và định tuyến theo thư mục |
| Redux Toolkit cho giỏ hàng | Đầy đủ nhưng nhiều mã mẫu hơn cho một giỏ hàng nhỏ |
| React Context | Nhẹ, nhưng dễ render lại thừa khi giỏ thay đổi |
| **Next.js + Zustand** | Gọn, đủ dùng, phù hợp yêu cầu |

## Hệ quả

- Tích cực: trang menu hiển thị nhanh nhờ render server; Tailwind bám Figma tốt; Zustand ít mã.
- Tiêu cực: ranh giới server/client component gây lỗi cho người mới; cache `.next` cũ có thể gây lỗi khó hiểu sau khi đổi nhánh (đã gặp lỗi hàm không tồn tại), cần xóa `.next` rồi chạy lại.
- Hạn chế hiện tại: giỏ hàng chỉ lưu trong bộ nhớ (mất khi tải lại trang, FR-16 mức Could); chưa có PWA **[Cần xác nhận]**.
- Liên quan: nơi lưu token xem ADR-005.
