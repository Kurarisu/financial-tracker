import { NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api"
).replace(/\/$/, "");

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "Unauthenticated." },
      { status: 401 }
    );
  }

  const { search } = new URL(request.url);

  try {
    // Proxy request to backend
    let upstream = await fetch(`${API_BASE_URL}/reports/export${search}`, {
      method: "GET",
      headers: {
        Authorization: authorization,
        Accept: "*/*",
      },
      cache: "no-store",
    });

    if (upstream.status === 404) {
      upstream = await fetch(`${API_BASE_URL}/transactions/export${search}`, {
        method: "GET",
        headers: {
          Authorization: authorization,
          Accept: "*/*",
        },
        cache: "no-store",
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "text/csv; charset=utf-8";
    const contentDisposition =
      upstream.headers.get("content-disposition") ??
      `attachment; filename="financial-report-${new Date().toISOString().slice(0, 10)}.csv"`;

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to connect to export service." },
      { status: 502 }
    );
  }
}
