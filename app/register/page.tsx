import AuthForm from "@/components/auth-form";
import AuthRouteLayout from "@/components/auth-route-layout";

export default function RegisterPage() {
  return <AuthRouteLayout><AuthForm mode="register" /></AuthRouteLayout>;
}
