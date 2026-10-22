const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api"
).replace(/\/$/, "");

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ success: false, message: "Unauthenticated." }, { status: 401 });
  }
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return Response.json({ success: false, message: "Not found." }, { status: 404 });
  try {
    const upstream = await fetch(`${API_BASE_URL}/transactions/${id}/attachment`, {
      headers: { Accept: "image/*", Authorization: authorization }, cache: "no-store",
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
        ...(upstream.headers.get("content-disposition") ? { "Content-Disposition": upstream.headers.get("content-disposition")! } : {}),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return Response.json({ success: false, message: "The backend API is unavailable." }, { status: 502 });
  }
}
