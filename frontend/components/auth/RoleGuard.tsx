"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { getUser, type Role } from "../../lib/auth";

// localStorage không thay đổi trong lúc trang đang mở nên không cần theo dõi
const subscribe = () => () => {};

/**
 * Bọc quanh trang chỉ dành cho một số role, ví dụ:
 *   <RoleGuard allow={["BARISTA"]}>...</RoleGuard>
 * - Chưa đăng nhập: chuyển về /login
 * - Sai role: chuyển sang /forbidden
 * Đây chỉ là lớp chặn ở giao diện, backend vẫn tự kiểm tra và trả 403.
 */
export default function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: ReactNode;
}) {
  const router = useRouter();
  const key = allow.join(",");

  // Đọc role từ localStorage mà không cần setState trong effect.
  // Phía server luôn trả "loading", trình duyệt trả kết quả thật.
  const status = useSyncExternalStore(
    subscribe,
    () => {
      const user = getUser();
      if (!user) return "guest";
      return key.split(",").includes(user.role) ? "allowed" : "forbidden";
    },
    () => "loading",
  );

  useEffect(() => {
    if (status === "guest") router.replace("/login");
    else if (status === "forbidden") router.replace("/forbidden");
  }, [status, router]);

  return status === "allowed" ? <>{children}</> : null;
}