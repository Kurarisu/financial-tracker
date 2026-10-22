import { proxyApiPut } from "@/lib/server/api-proxy";

export function PUT(request: Request) {
  return proxyApiPut(request, "auth/password");
}
