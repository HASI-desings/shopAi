import { NextResponse } from "next/server";
import { authenticate } from "@/lib/apiAuth";
import { admin, DB, C } from "@/lib/appwrite";
export async function GET(req: Request) {
  const a = await authenticate(req);
  if (a.error) return NextResponse.json({ success: false, error: a.error }, { status: a.error.status });
  if (!a.principal!.permissions.includes("projects:read")) return NextResponse.json({ success: false, error: { code: "forbidden", message: "Missing projects:read" } }, { status: 403 });
  const p: any = await admin().db.getDocument(DB, C.projects, a.principal!.projectId).catch(() => null);
  return NextResponse.json({ success: true, data: p ? [{ id: p.$id, name: p.name, environment: p.environment, created_at: p.$createdAt }] : [] });
}
