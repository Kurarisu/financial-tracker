const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api"
).replace(/\/$/, "");

async function proxyApiRequest(
  request: Request,
  endpoint: string,
  method: "GET" | "POST" | "PUT",
) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return Response.json(
      { success: false, message: "Unauthenticated." },
      { status: 401 },
    );
  }

  try {
    const body = method === "GET" ? "" : await request.text();
    const upstream = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: authorization,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return Response.json(
      { success: false, message: "The backend API is unavailable." },
      { status: 502 },
    );
  }
}

export function proxyApiGet(request: Request, endpoint: string) {
  return proxyApiRequest(request, endpoint, "GET");
}

export function proxyApiPost(request: Request, endpoint: string) {
  return proxyApiRequest(request, endpoint, "POST");
}

export function proxyApiPut(request: Request, endpoint: string) {
  return proxyApiRequest(request, endpoint, "PUT");
}