const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api"
).replace(/\/$/, "");

async function proxyAccountRequest(request: Request, method: "GET" | "POST", body?: unknown) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return Response.json(
      { success: false, message: "Unauthenticated." },
      { status: 401 },
    );
  }

  const endpoint = "accounts";

  try {
    const upstreamResponse = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: authorization,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
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

export function GET(request: Request) {
  return proxyAccountRequest(request, "GET");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return proxyAccountRequest(request, "POST", body);
}

export async function PATCH(request: Request) {
  const authorization = request.headers.get("authorization");
  const body = await request.json().catch(() => null) as {
    account_id?: number;
    initial_balance?: number;
  } | null;

  if (!authorization?.startsWith("Bearer ") || !body) {
    return Response.json({ success: false, message: "Invalid request." }, { status: 401 });
  }

  const accountId = Number(body.account_id);
  const initialBalance = Number(body.initial_balance);
  if (!Number.isInteger(accountId) || accountId < 1 || !Number.isFinite(initialBalance) || initialBalance < 0) {
    return Response.json({ success: false, message: "Invalid opening balance." }, { status: 422 });
  }

  try {
    const upstreamResponse = await fetch(`${API_BASE_URL}/accounts/${accountId}/opening-balance`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ initial_balance: initialBalance }),
      cache: "no-store",
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: { "Content-Type": upstreamResponse.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json({ success: false, message: "The backend API is unavailable." }, { status: 502 });
  }
}
