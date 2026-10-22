"use client";

import { Activity, Ellipsis, House, Plus, UserRound, WalletCards } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";

const primaryLinks = [
  { href: "/", messageKey: "overview" },
  { href: "/transactions", messageKey: "transactions" },
  { href: "/accounts", messageKey: "accounts" },
  { href: "/categories", messageKey: "categories" },
  { href: "/reports", messageKey: "reports" },
] as const;

function isActivePath(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const navigation = useTranslations("Navigation");
  const actions = useTranslations("Actions");
  const [moreOpen, setMoreOpen] = useState(false);
  const activeLink = primaryLinks.find((link) => isActivePath(pathname, link.href));
  const activeTitle = navigation(
    pathname === "/transactions/new"
      ? "newTransaction"
      : pathname === "/profile"
        ? "profile"
        : activeLink?.messageKey ?? "overview",
  );
  const moreIsActive = ["/categories", "/reports"].some((href) =>
    isActivePath(pathname, href),
  );

  if (pathname === "/login" || pathname === "/register") {
    return (
      <div className="@container/app mx-auto min-h-dvh w-full max-w-[430px] bg-background text-foreground shadow-[0_0_32px_rgba(25,54,94,0.08)]">
        {children}
      </div>
    );
  }

  return (
    <div className="@container/app mx-auto min-h-dvh w-full max-w-[430px] bg-background text-foreground shadow-[0_0_32px_rgba(25,54,94,0.08)]">
      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-surface/90 px-5 backdrop-blur-md @sm/app:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <p className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-muted @sm/app:block">
                {navigation("personalFinance")}
              </p>
              <h1 className="truncate text-base font-bold @sm/app:mt-0.5 @sm/app:text-lg text-foreground">
                {activeTitle}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              aria-current={pathname === "/profile" ? "page" : undefined}
              aria-label={navigation("profile")}
              className="inline-flex size-8 items-center justify-center rounded-full border border-border/80 bg-surface text-muted transition-colors hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              href="/profile"
              title={navigation("profile")}
            >
              <UserRound aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 pb-24">{children}</main>
      </div>

      <nav
        aria-label={navigation("mobileNavigation")}
        className="fixed bottom-0 left-1/2 z-40 grid h-16 w-full max-w-[430px] -translate-x-1/2 grid-cols-5 border-t border-border/80 bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      >
        {primaryLinks.slice(0, 2).map((link) => {
          const active = isActivePath(pathname, link.href);
          const label = navigation(link.href === "/" ? "home" : "activity");

          return (
            <Link
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
                active ? "text-primary font-bold" : "text-muted hover:text-foreground"
              } focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary`}
              href={link.href}
              key={link.href}
              title={label}
            >
              {link.href === "/" ? (
                <House aria-hidden="true" className={`size-5 transition-transform ${active ? "scale-105" : ""}`} />
              ) : (
                <Activity aria-hidden="true" className={`size-5 transition-transform ${active ? "scale-105" : ""}`} />
              )}
            </Link>
          );
        })}
        <div className="flex items-center justify-center">
          <Link
            aria-label={actions("addTransaction")}
            className="flex size-11 -translate-y-2 items-center justify-center rounded-full bg-brand text-white shadow-[0_6px_18px_rgba(22,168,121,0.35)] transition-all hover:scale-105 hover:bg-brand-hover active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            href="/transactions/new"
          >
            <Plus aria-hidden="true" className="size-5 stroke-[2.5]" />
          </Link>
        </div>
        <Link
          aria-current={isActivePath(pathname, "/accounts") ? "page" : undefined}
          aria-label={navigation("accounts")}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary ${
            isActivePath(pathname, "/accounts") ? "text-primary font-bold" : "text-muted hover:text-foreground"
          }`}
          href="/accounts"
          title={navigation("accounts")}
        >
          <WalletCards aria-hidden="true" className={`size-5 transition-transform ${isActivePath(pathname, "/accounts") ? "scale-105" : ""}`} />
        </Link>
        <button
          aria-controls="mobile-more-menu"
          aria-expanded={moreOpen}
          aria-label={navigation(moreOpen ? "closeMore" : "openMore")}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors cursor-pointer ${
            moreIsActive || moreOpen ? "text-primary font-bold" : "text-muted hover:text-foreground"
          } focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary`}
          onClick={() => setMoreOpen((open) => !open)}
          type="button"
        >
          <Ellipsis aria-hidden="true" className="size-5" />
        </button>
      </nav>

      {moreOpen && (
        <div
          className="app-more-menu fixed bottom-[78px] z-50 w-52 rounded-md border border-border bg-surface p-2 shadow-lg"
          id="mobile-more-menu"
        >
          {primaryLinks.slice(3).map((link) => {
            const active = isActivePath(pathname, link.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex h-10 items-center rounded-md px-3 text-sm font-medium ${
                  active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-background"
                } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
                href={link.href}
                key={link.href}
                onClick={() => setMoreOpen(false)}
              >
                {navigation(link.messageKey)}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
