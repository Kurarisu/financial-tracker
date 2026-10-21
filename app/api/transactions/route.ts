const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api"
).replace(/\/$/, "");

async function forwardTransactionRequest(
  request: Request,
  method: "GET" | "POST",
  endpoint: string,
  payload?: unknown,
) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return Response.json(
      { success: false, message: "Unauthenticated." },
      { status: 401 },
    );
  }

  try {
    const upstreamResponse = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: authorization,
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
      body: payload ? JSON.stringify(payload) : undefined,
      cache: "no-store",
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": upstreamResponse.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return Response.json(
      { success: false, message: "The backend API is unavailable." },
      { status: 502 },
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.toString();

  return forwardTransactionRequest(request, "GET", `transactions${search ? `?${search}` : ""}`);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return forwardTransactionRequest(request, "POST", "transactions", body);
}
