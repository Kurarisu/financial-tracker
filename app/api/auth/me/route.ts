import { proxyApiDelete, proxyApiGet, proxyApiPatch } from "@/lib/server/api-proxy";

export function GET(request: Request) {
  return proxyApiGet(request, "auth/me");
}

export function PATCH(request: Request) {
  return proxyApiPatch(request, "auth/me");
}

export function DELETE(request: Request) {
  return proxyApiDelete(request, "auth/me");
}
