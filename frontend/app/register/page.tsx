import AuthShell from "../../components/auth/AuthShell";
import RegisterForm from "../../components/auth/RegisterForm";

export const metadata = {
  title: "Tạo tài khoản | Brewlite",
};

export default function RegisterPage() {
  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}