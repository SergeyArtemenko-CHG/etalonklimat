import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: "/api/telegram-webhook",
};

const INTERNAL_HEADER = "x-telegram-webhook-internal";

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/telegram-webhook")) {
    return NextResponse.next();
  }

  if (request.headers.get(INTERNAL_HEADER) === "1") {
    return NextResponse.next();
  }

  try {
    const url = new URL(request.url);
    const body = request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined;

    const headers = new Headers(request.headers);
    headers.set(INTERNAL_HEADER, "1");

    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
    });

    const resBody = await res.text();
    const headers = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) {
      headers.set("content-type", ct);
    }

    return new Response(resBody, {
      status: res.status,
      headers,
    });
  } catch {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
