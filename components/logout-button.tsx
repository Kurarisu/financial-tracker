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
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-background/70 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
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
