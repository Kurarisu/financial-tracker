import { proxyApiGet, proxyApiPost } from "@/lib/server/api-proxy";

export function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const includeDefaults = url.searchParams.get("include_defaults") === "1";
  const query = new URLSearchParams();
  if (type) query.set("type", type);
  if (includeDefaults) query.set("include_defaults", "1");

  return proxyApiGet(request, query.size ? `categories?${query.toString()}` : "categories");
}

export function POST(request: Request) {
  return proxyApiPost(request, "categories");
}
