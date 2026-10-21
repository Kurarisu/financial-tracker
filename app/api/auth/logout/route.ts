import { proxyApiPost } from "@/lib/server/api-proxy";

export function POST(request: Request) {
  return proxyApiPost(request, "auth/logout");
}