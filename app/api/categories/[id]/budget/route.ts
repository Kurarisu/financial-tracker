import { proxyApiPut } from "@/lib/server/api-proxy";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return Response.json(
      { success: false, message: "Invalid category ID." },
      { status: 400 },
    );
  }

  return proxyApiPut(request, `categories/${id}/budget`);
}
