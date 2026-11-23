import AdminOrdersClient from './AdminOrdersClient';

// Trang quản trị kiểm tra đăng nhập ở trình duyệt trước khi hiển thị nội dung.
export const instant = false;

export default function AdminOrdersPage() {
  return <AdminOrdersClient />;
}
