import { NextResponse } from "next/server";
import { parseLink } from "@/app/actions/parse";
import { requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({} as { url?: string; raw?: string }));
  const input = body?.url ?? body?.raw ?? "";
  try {
    const result = await parseLink(String(input));
    return NextResponse.json(result);
  } catch (error) {
    console.error("parse route failed", error);
    return NextResponse.json({ ok: false, error: "Couldn't parse that link." }, { status: 500 });
  }
}
