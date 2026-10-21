"use client";

export default function LoadingBar({ className = "" }: { className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label="Loading..."
      className={`relative h-1 w-full overflow-hidden rounded-full bg-emerald-100/60 ${className}`}
    >
      <div className="absolute inset-y-0 h-full animate-indeterminate rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
    </div>
  );
}
