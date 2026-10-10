import { NextResponse } from "next/server";
import { authenticate } from "@/lib/apiAuth";
import { admin, DB, C, Query } from "@/lib/appwrite";
import { usedThisPeriod } from "@/lib/quota";
export async function GET(req: Request) {
  const a = await authenticate(req);
  if (a.error) return NextResponse.json({ success: false, error: a.error }, { status: a.error.status });
  if (!a.principal!.permissions.includes("usage:read")) return NextResponse.json({ success: false, error: { code: "forbidden", message: "Missing usage:read" } }, { status: 403 });
  const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
  const r = await admin().db.listDocuments(DB, C.usage, [Query.equal("owner_id", [a.principal!.ownerId]), Query.greaterThanEqual("$createdAt", start.toISOString()), Query.limit(1)]);
  return NextResponse.json({ success: true, data: { units_used_this_period: await usedThisPeriod(a.principal!.ownerId), unit_limit: a.plan!.request_limit, requests_this_period: r.total } });
}
