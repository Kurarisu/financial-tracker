import { proxyApiGet } from "@/lib/server/api-proxy";

export function GET(request: Request) {
  return proxyApiGet(request, "reports/cashflow-trend?months=6");
}