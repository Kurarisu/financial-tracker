"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AccountForm from "@/components/account-form";
import CashBalanceSetup from "@/components/cash-balance-setup";

function NewAccountContent() {
  const searchParams = useSearchParams();
  return searchParams.get("setupCash") === "true" ? <CashBalanceSetup /> : <AccountForm />;
}

export default function NewAccountPage() {
  return (
    <Suspense>
      <NewAccountContent />
    </Suspense>
  );
}
