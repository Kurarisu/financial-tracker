"use client";

import AppShell from "@/components/app-shell";

export default function AppRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
