"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export default function LogoutButton() {
  const actions = useTranslations("Actions");
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    const token = sessionStorage.getItem("auth_token");

    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => null);
    }

    sessionStorage.removeItem("auth_token");
    router.replace("/login");
  }

  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-expense/25 bg-expense/5 px-2.5 text-xs font-semibold text-expense transition-colors duration-150 hover:bg-expense/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-expense disabled:cursor-wait disabled:opacity-60 cursor-pointer @sm/app:gap-2 @sm/app:px-3 @sm/app:text-sm"
      disabled={isLoggingOut}
      onClick={() => void handleLogout()}
      type="button"
    >
      {isLoggingOut ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <LogOut aria-hidden="true" className="size-4" />
      )}
      {actions(isLoggingOut ? "loggingOut" : "logout")}
    </button>
  );
}
