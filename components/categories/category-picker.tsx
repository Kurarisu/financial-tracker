"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { getCategoryVisual } from "@/components/categories/category-visuals";
import { useTranslations } from "next-intl";

type CategoryOption = { id: number; name: string; color?: string | null };

export default function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: {
  categories: CategoryOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("Transactions");
  const [search, setSearch] = useState("");
  const buttons = useRef(new Map<number, HTMLButtonElement>());
  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return categories.filter((category) => {
      const { messageKey } = getCategoryVisual(category.name, category.color);
      const localizedName = messageKey ? t(messageKey) : category.name;
      return `${category.name} ${localizedName}`.toLocaleLowerCase().includes(query);
    });
  }, [categories, search, t]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const columns = window.matchMedia("(min-width: 768px)").matches ? 3 : 2;
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % filteredCategories.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + filteredCategories.length) % filteredCategories.length;
    else if (event.key === "ArrowDown") nextIndex = (index + columns) % filteredCategories.length;
    else if (event.key === "ArrowUp") nextIndex = (index - columns + filteredCategories.length) % filteredCategories.length;
    else return;
    event.preventDefault();
    const category = filteredCategories[nextIndex];
    onSelect(String(category.id));
    buttons.current.get(category.id)?.focus();
  }

  return (
    <fieldset className="min-w-0 space-y-2.5 text-sm font-medium text-foreground">
      <legend className="mb-2">{t("category")}</legend>
      {categories.length > 12 && (
        <label className="relative block">
          <span className="sr-only">{t("searchCategories")}</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary/30"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchCategories")}
            type="search"
            value={search}
          />
        </label>
      )}
      {filteredCategories.length ? (
        <div aria-label={t("selectCategory")} className="grid grid-cols-2 gap-2 @md/app:grid-cols-3" role="radiogroup">
          {filteredCategories.map((category, index) => {
            const selected = selectedId === String(category.id);
            const visual = getCategoryVisual(category.name, category.color);
            const { icon: Icon, color } = visual;
            const categoryName = visual.messageKey ? t(visual.messageKey) : category.name;
            return (
              <button
                aria-checked={selected}
                className={`relative flex h-[76px] min-w-0 items-center gap-2.5 rounded-xl border px-2.5 pr-8 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 hover:border-primary/60 hover:bg-primary/5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary @sm/app:px-3 ${selected ? "shadow-[0_0_0_1px_var(--category-accent)]" : "border-border bg-background"}`}
                key={category.id}
                onClick={() => onSelect(String(category.id))}
                onKeyDown={(event) => handleKeyDown(event, index)}
                ref={(element) => {
                  if (element) buttons.current.set(category.id, element);
                  else buttons.current.delete(category.id);
                }}
                role="radio"
                style={{
                  "--category-accent": color,
                  borderColor: selected ? color : undefined,
                  backgroundColor: selected ? `${color}16` : undefined,
                } as CSSProperties}
                tabIndex={selected || (!filteredCategories.some((item) => String(item.id) === selectedId) && index === 0) ? 0 : -1}
                type="button"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: color, color: "#14212b" }}>
                  <Icon aria-hidden="true" className="size-[18px]" strokeWidth={2.2} />
                </span>
                <span className="line-clamp-2 min-w-0 text-xs font-semibold leading-4 text-foreground @sm/app:text-sm">{categoryName}</span>
                {selected && <span aria-hidden="true" className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full" style={{ backgroundColor: color, color: "#111827" }}><Check className="size-3.5" strokeWidth={3} /></span>}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted">{t("categoryNotFound")}</p>
      )}
    </fieldset>
  );
}
