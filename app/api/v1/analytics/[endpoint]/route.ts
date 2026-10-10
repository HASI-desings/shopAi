import { NextResponse } from "next/server";
import { authenticate } from "@/lib/apiAuth";
import { runEndpoint } from "@/lib/run";
export const runtime = "nodejs"; export const maxDuration = 60;
export async function POST(req: Request, { params }: { params: { endpoint: string } }) {
  const a = await authenticate(req);
  if (a.error) return NextResponse.json({ success: false, error: { code: a.error.code, message: a.error.message } }, { status: a.error.status });
  const r = await runEndpoint(params.endpoint, a.principal!, await req.text(), a.plan!);
  return NextResponse.json(r.body, { status: r.status });
}
