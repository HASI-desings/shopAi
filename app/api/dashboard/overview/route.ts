import { NextResponse } from "next/server";
import { admin, requireUser, DB, C, Query, norm } from "@/lib/appwrite";
import { getPlan, usedThisPeriod } from "@/lib/quota";
export async function GET() {
  const u = await requireUser(); if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { db } = admin(), me = Query.equal("owner_id", [u.$id]), since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [projects, keys, usage, plan, used] = await Promise.all([
    db.listDocuments(DB, C.projects, [me, Query.limit(100)]),
    db.listDocuments(DB, C.keys, [me, Query.orderDesc("$createdAt"), Query.limit(200)]),
    db.listDocuments(DB, C.usage, [me, Query.greaterThanEqual("$createdAt", since), Query.orderDesc("$createdAt"), Query.limit(1000)]),
    getPlan(u.$id), usedThisPeriod(u.$id),
  ]);
  const hide = (k: any) => { const { secret_hash, ...rest } = norm(k); return rest; };
  return NextResponse.json({ email: u.email, verified: u.emailVerification, projects: projects.documents.map(norm), keys: keys.documents.map(hide), usage: usage.documents.map(norm), plan, used });
}
