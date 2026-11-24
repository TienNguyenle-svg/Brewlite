import AdminInventoryClient from './AdminInventoryClient';

// Trang quản trị kiểm tra đăng nhập ở trình duyệt trước khi hiển thị nội dung.
export const instant = false;

export default function AdminInventoryPage() {
  return <AdminInventoryClient />;
}
