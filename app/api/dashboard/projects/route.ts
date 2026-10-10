import { NextResponse } from "next/server";
import { z } from "zod";
import { admin, requireUser, DB, C, ID, Query, norm } from "@/lib/appwrite";
import { getPlan } from "@/lib/quota";
const body = z.object({ name: z.string().min(1).max(80), description: z.string().max(300).optional(), environment: z.enum(["development", "production"]) });
export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const b = body.safeParse(await req.json().catch(() => null)); if (!b.success) return NextResponse.json({ error: "Invalid project" }, { status: 422 });
  const { db } = admin(), plan = await getPlan(u.$id);
  const mine = await db.listDocuments(DB, C.projects, [Query.equal("owner_id", [u.$id]), Query.limit(100)]);
  if (mine.total >= plan.max_projects) return NextResponse.json({ error: `Your plan allows ${plan.max_projects} project(s).` }, { status: 403 });
  const d = await db.createDocument(DB, C.projects, ID.unique(), { ...b.data, owner_id: u.$id });
  await db.createDocument(DB, C.audit, ID.unique(), { actor_id: u.$id, action: "project.create", resource_type: "project", resource_id: d.$id }).catch(() => {});
  return NextResponse.json({ project: norm(d) });
}
export async function DELETE(req: Request) {
  const u = await requireUser(); if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "", { db } = admin();
  const p: any = await db.getDocument(DB, C.projects, id).catch(() => null);
  if (!p || p.owner_id !== u.$id) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const keys = await db.listDocuments(DB, C.keys, [Query.equal("owner_id", [u.$id]), Query.limit(100)]);
  await Promise.all(keys.documents.filter((k: any) => k.project_id === id).map((k) => db.deleteDocument(DB, C.keys, k.$id)));
  await db.deleteDocument(DB, C.projects, id);
  await db.createDocument(DB, C.audit, ID.unique(), { actor_id: u.$id, action: "project.delete", resource_type: "project", resource_id: id }).catch(() => {});
  return NextResponse.json({ ok: true });
}
