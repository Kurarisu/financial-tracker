"use client";

import { Loader2, Plus } from "lucide-react";
import type { Category } from "@/components/categories/category-types";

export default function CategoryCreateForm({
  name,
  type,
  color,
  saving,
  onNameChange,
  onTypeChange,
  onColorChange,
  onSubmit,
  labels,
}: {
  name: string;
  type: Category["type"];
  color: string;
  saving: boolean;
  onNameChange: (value: string) => void;
  onTypeChange: (value: Category["type"]) => void;
  onColorChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  labels: { add: string; name: string; type: string; expense: string; income: string; color: string; saving: string };
}) {
  return (
    <form className="mb-6 rounded-2xl border border-border/80 bg-surface p-5 shadow-xs" onSubmit={onSubmit}>
      <h3 className="mb-4 text-base font-bold text-foreground">{labels.add}</h3>
      <div className="space-y-3.5">
        <label className="block space-y-1.5 text-xs font-semibold text-foreground">
          <span>{labels.name}</span>
          <input className="h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" maxLength={255} onChange={(event) => onNameChange(event.target.value)} placeholder={labels.name} required value={name} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5 text-xs font-semibold text-foreground">
            <span>{labels.type}</span>
            <select className="h-10 w-full cursor-pointer rounded-xl border border-border/80 bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" onChange={(event) => onTypeChange(event.target.value as Category["type"])} value={type}>
              <option value="expense">{labels.expense}</option>
              <option value="income">{labels.income}</option>
            </select>
          </label>
          <label className="block space-y-1.5 text-xs font-semibold text-foreground">
            <span>{labels.color}</span>
            <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-border/80 bg-background px-2.5">
              <input className="size-6 cursor-pointer rounded-md border-0 bg-transparent p-0" onChange={(event) => onColorChange(event.target.value)} type="color" value={color} />
              <span className="text-xs font-mono uppercase text-muted">{color}</span>
            </div>
          </label>
        </div>
        <button className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-hover active:scale-98 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving || !name.trim()} type="submit">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {saving ? labels.saving : labels.add}
        </button>
      </div>
    </form>
  );
}
