const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api"
).replace(/\/$/, "");

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ success: false, message: "Unauthenticated." }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${API_BASE_URL}/receipts/scan`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: authorization },
      body: await request.formData(),
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
