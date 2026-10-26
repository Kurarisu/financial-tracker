"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function PageHeader({
  title,
  breadcrumb,
  backHref = "/transactions",
}: {
  title: string;
  breadcrumb: string;
  backHref?: string;
}) {
  const router = useRouter();
  const t = useTranslations("Transactions");

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.replace(backHref);
  }

  return (
    <header className="sticky top-16 z-20 -mx-5 mb-5 border-b border-border/80 bg-background/95 px-5 py-3 backdrop-blur-md @sm/app:-mx-8 @sm/app:px-8">
      <div className="flex min-h-11 items-center gap-3">
        <button
          aria-label={t("back")}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-muted transition-colors duration-150 hover:bg-surface hover:text-foreground active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={goBack}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
          <span>{t("back")}</span>
        </button>
        <div className="min-w-0 border-l border-border pl-3">
          <p className="truncate text-xs font-medium text-muted">{breadcrumb}</p>
          <h2 className="truncate text-lg font-bold tracking-tight text-foreground @sm/app:text-xl">
            {title}
          </h2>
        </div>
      </div>
    </header>
  );
}
