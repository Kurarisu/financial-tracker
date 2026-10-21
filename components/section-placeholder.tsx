import { useTranslations } from "next-intl";

export default function SectionPlaceholder({ title }: { title: string }) {
  const t = useTranslations("Placeholder");

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-7 @sm/app:px-8 @sm/app:py-9">
      <div className="mb-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {t("section")}
        </p>
        <h2 className="text-2xl font-semibold tracking-normal @sm/app:text-[28px]">
          {title}
        </h2>
      </div>
      <section className="flex min-h-[220px] items-center rounded-md border border-dashed border-border bg-surface px-6">
        <div>
          <p className="text-sm font-semibold">{t("pageTitle", { title })}</p>
          <p className="mt-1 text-sm text-muted">{t("message")}</p>
        </div>
      </section>
    </div>
  );
}