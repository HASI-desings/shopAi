import { NextResponse } from "next/server";
import { admin, requireUser, DB, C } from "@/lib/appwrite";
import { runEndpoint } from "@/lib/run";
import { getPlan } from "@/lib/quota";
export const maxDuration = 60;
// Playground runs through the signed-in session: no customer key is ever sent to or stored in the browser.
export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { endpoint, project_id, body } = await req.json().catch(() => ({}));
  const proj: any = await admin().db.getDocument(DB, C.projects, String(project_id ?? "")).catch(() => null);
  if (!proj || proj.owner_id !== u.$id) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const t = Date.now();
  const r = await runEndpoint(String(endpoint), { ownerId: u.$id, projectId: proj.$id, keyId: null, permissions: ["analytics:read", "analytics:ai"] }, typeof body === "string" ? body : JSON.stringify(body), await getPlan(u.$id));
  return NextResponse.json({ status: r.status, duration_ms: Date.now() - t, response: r.body });
}
