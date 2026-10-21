import { proxyApiGet } from "@/lib/server/api-proxy";

export function GET(request: Request) {
  const { search } = new URL(request.url);
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const query = search ? search.slice(1) : `month=${month}&year=${year}&type=expense`;
  return proxyApiGet(request, `reports/category-breakdown?${query}`);
}
