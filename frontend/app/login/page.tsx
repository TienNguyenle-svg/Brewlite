import { Suspense } from "react";
import AuthShell from "../../components/auth/AuthShell";
import LoginForm from "../../components/auth/LoginForm";

export const metadata = {
  title: "Đăng nhập | Brewlite",
};

export default function LoginPage() {
  return (
    <AuthShell>
      {/* LoginForm dùng useSearchParams nên cần Suspense khi build */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}