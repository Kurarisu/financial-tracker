import AuthForm from "@/components/auth-form";
import AuthRouteLayout from "@/components/auth-route-layout";

export default function LoginPage() {
  return <AuthRouteLayout><AuthForm mode="login" /></AuthRouteLayout>;
}
