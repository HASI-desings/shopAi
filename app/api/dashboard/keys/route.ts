import { NextResponse } from "next/server";
import { z } from "zod";
import { admin, requireUser, DB, C, ID, Query } from "@/lib/appwrite";
import { generateKey, PERMISSIONS } from "@/lib/keys";
import { getPlan, hitRate } from "@/lib/quota";
const create = z.object({ name: z.string().min(1).max(60), project_id: z.string().min(1).max(36), permissions: z.array(z.enum(PERMISSIONS)).min(1), expires_at: z.string().datetime().nullable().optional() });
const rotate = z.object({ action: z.literal("rotate"), id: z.string().min(1).max(36) });
async function mint(owner: string, project: string, name: string, scopes: string[], expires: string | null | undefined) {
  const { db } = admin();
  const proj: any = await db.getDocument(DB, C.projects, project).catch(() => null);
  if (!proj || proj.owner_id !== owner) return null; // ownership check
  const k = generateKey(proj.environment === "production" ? "live" : "test");
  const data: any = { owner_id: owner, project_id: project, name, public_prefix: k.prefix, secret_hash: k.hash, scopes, status: "active" };
  if (expires) data.expires_at = expires;
  const d = await db.createDocument(DB, C.keys, ID.unique(), data);
  await db.createDocument(DB, C.audit, ID.unique(), { actor_id: owner, action: "key.create", resource_type: "api_key", resource_id: d.$id, metadata: JSON.stringify({ prefix: k.prefix }) }).catch(() => {});
  return { id: d.$id, key: k.full, prefix: k.prefix };
}
export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!u.emailVerification) return NextResponse.json({ error: "Verify your email before creating keys." }, { status: 403 });
  if (!(await hitRate(`kc_${u.$id}`, 10, 3600).catch(() => true))) return NextResponse.json({ error: "Too many key operations. Try again later." }, { status: 429 });
  const { db } = admin(), raw = await req.json().catch(() => null), r = rotate.safeParse(raw);
  if (r.success) {
    const old: any = await db.getDocument(DB, C.keys, r.data.id).catch(() => null);
    if (!old || old.owner_id !== u.$id || old.status !== "active") return NextResponse.json({ error: "Key not found" }, { status: 404 });
    const fresh = await mint(u.$id, old.project_id, old.name, old.scopes, old.expires_at);
    await db.updateDocument(DB, C.keys, old.$id, { status: "revoked", revoked_at: new Date().toISOString() });
    return NextResponse.json(fresh);
  }
  const c = create.safeParse(raw); if (!c.success) return NextResponse.json({ error: "Invalid key request" }, { status: 422 });
  const plan = await getPlan(u.$id);
  const mine = await db.listDocuments(DB, C.keys, [Query.equal("owner_id", [u.$id]), Query.limit(500)]);
  if (mine.documents.filter((k: any) => k.status === "active").length >= plan.max_keys) return NextResponse.json({ error: `Your plan allows ${plan.max_keys} active keys.` }, { status: 403 });
  const k = await mint(u.$id, c.data.project_id, c.data.name, c.data.permissions, c.data.expires_at);
  return k ? NextResponse.json(k) : NextResponse.json({ error: "Project not found" }, { status: 404 });
}
export async function DELETE(req: Request) {
  const u = await requireUser(); if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "", { db } = admin();
  const k: any = await db.getDocument(DB, C.keys, id).catch(() => null);
  if (!k || k.owner_id !== u.$id) return NextResponse.json({ error: "Key not found" }, { status: 404 });
  await db.updateDocument(DB, C.keys, id, { status: "revoked", revoked_at: new Date().toISOString() });
  await db.createDocument(DB, C.audit, ID.unique(), { actor_id: u.$id, action: "key.revoke", resource_type: "api_key", resource_id: id }).catch(() => {});
  return NextResponse.json({ ok: true });
}
