import LoadingBar from "@/components/ui/loading-bar";

export default function DashboardLoading() {
  return (
      <div className="mx-auto w-full max-w-[1440px] px-5 py-5 sm:px-6" role="status" aria-busy="true">
        <LoadingBar className="mb-4" />

        {/* Title skeleton */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-6 w-36 rounded-lg bg-slate-200 animate-pulse" />
          </div>
          <div className="h-8 w-28 rounded-full bg-slate-200 animate-pulse" />
        </div>

        <div className="space-y-4">
          {/* Hero balance skeleton */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#122645] to-[#18355c] p-5 text-white shadow-sm border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-white/10 animate-pulse" />
                <div className="h-3 w-20 rounded-full bg-white/20 animate-pulse" />
              </div>
              <div className="size-6 rounded-lg bg-white/10 animate-pulse" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-8 w-48 rounded-lg bg-white/20 animate-pulse" />
              <div className="h-3 w-32 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>

          {/* Income & Expense sub-cards skeleton */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/80 bg-surface p-4 space-y-3">
              <div className="size-7 rounded-lg bg-slate-200 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3 w-16 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-5 w-24 rounded-lg bg-slate-200 animate-pulse" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-surface p-4 space-y-3">
              <div className="size-7 rounded-lg bg-slate-200 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3 w-16 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-5 w-24 rounded-lg bg-slate-200 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Chart & Recent transactions skeleton */}
          <div className="grid gap-4 @xl/app:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.9fr)]">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-4 w-20 rounded-full bg-slate-200 animate-pulse" />
              </div>
              <div className="flex h-44 items-end justify-between gap-3 pt-4">
                {[40, 70, 30, 85, 50, 95].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      className="w-full max-w-[24px] rounded-full bg-slate-100 animate-pulse"
                      style={{ height: `${h}%` }}
                    />
                    <div className="h-2.5 w-6 rounded-full bg-slate-200 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-3 w-16 rounded-full bg-slate-200 animate-pulse" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-24 rounded-full bg-slate-200 animate-pulse" />
                      <div className="h-2.5 w-16 rounded-full bg-slate-200 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-16 rounded-lg bg-slate-200 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}
