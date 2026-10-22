const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api"
).replace(/\/$/, "");

async function proxyTransaction(request: Request, context: { params: Promise<{ id: string }> }, method: "GET" | "PUT") {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ success: false, message: "Unauthenticated." }, { status: 401 });
  }
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return Response.json({ success: false, message: "Not found." }, { status: 404 });

  try {
    const upstream = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: authorization,
        ...(method === "PUT" ? { "Content-Type": "application/json" } : {}),
      },
      body: method === "PUT" ? await request.text() : undefined,
      cache: "no-store",
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json({ success: false, message: "The backend API is unavailable." }, { status: 502 });
  }
}

export function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyTransaction(request, context, "GET");
}

export function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return proxyTransaction(request, context, "PUT");
}
