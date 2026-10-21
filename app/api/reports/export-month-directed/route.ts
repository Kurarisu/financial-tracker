import { NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api"
).replace(/\/$/, "");

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "Unauthenticated." },
      { status: 401 }
    );
  }

  const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated." },
        { status: 401 }
      );
    }

    try {
      const body = await request.json();
      const upstream = await fetch(`${API_BASE_URL}/reports/export-month-directed`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

    const contentType = upstream.headers.get("content-type") ?? "text/csv; charset=utf-8";
    const contentDisposition =
      upstream.headers.get("content-disposition") ??
      `attachment; filename="reports-${body.year || new Date().getFullYear()}-${String(
        body.month || new Date().getMonth() + 1
      ).padStart(2, "0")}.csv"`;

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