import { NextResponse } from "next/server";
import { admin, DB } from "@/lib/appwrite";
export const maxDuration = 60;
type A = { k: string; t: "s" | "i" | "f" | "d"; n?: number; req?: boolean; arr?: boolean };
const s = (k: string, n: number, req = false, arr = false): A => ({ k, t: "s", n, req, arr });
const i = (k: string, req = false): A => ({ k, t: "i", req }), f = (k: string): A => ({ k, t: "f" }), d = (k: string): A => ({ k, t: "d" });
type Idx = [string, "key" | "unique", string[]];
const SCHEMA: Record<string, { attrs: A[]; idx: Idx[] }> = {
  counters: { attrs: [i("used"), i("win"), i("hits"), d("locked_at")], idx: [] },
  projects: { attrs: [s("owner_id", 36, true), s("name", 80, true), s("description", 300), s("environment", 16, true)], idx: [["by_owner", "key", ["owner_id"]]] },
  api_keys: { attrs: [s("owner_id", 36, true), s("project_id", 36, true), s("name", 80, true), s("public_prefix", 40, true), s("secret_hash", 64, true), s("scopes", 32, true, true), s("status", 16, true), d("expires_at"), d("last_used_at"), d("revoked_at")],
    idx: [["by_owner", "key", ["owner_id"]], ["by_prefix", "unique", ["public_prefix"]]] },
  api_usage: { attrs: [s("owner_id", 36, true), s("project_id", 36), s("api_key_id", 36), s("request_id", 64, true), s("endpoint", 64, true), i("status_code", true), i("duration_ms"), i("request_units", true), i("input_tokens"), i("output_tokens"), s("model_identifier", 64), f("estimated_provider_cost")], idx: [["by_owner", "key", ["owner_id"]]] },
  subscriptions: { attrs: [s("owner_id", 36, true), s("plan_id", 32, true), s("status", 16, true)], idx: [["by_owner", "key", ["owner_id"]]] },
  audit_logs: { attrs: [s("actor_id", 36, true), s("action", 64, true), s("resource_type", 32), s("resource_id", 64), s("metadata", 500)], idx: [["by_actor", "key", ["actor_id"]]] },
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Idempotent: creates the database, collections, attributes and indexes. Safe to open repeatedly until it reports done: true.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) return new NextResponse("Not found", { status: 404 });
  const { db } = admin(), log: string[] = []; let errors = 0, pending = false;
  const step = async (what: string, p: Promise<unknown>) => { try { await p; log.push(`created ${what}`); } catch (e: any) { if (e.code === 409) log.push(`ok (exists) ${what}`); else { errors++; log.push(`ERROR ${what}: ${e.message}`); } } };
  await step("database meeru", db.create(DB, "Meeru"));
  for (const [col, { attrs, idx }] of Object.entries(SCHEMA)) {
    await step(`collection ${col}`, db.createCollection(DB, col, col, [], false));
    for (const a of attrs) {
      const w = `${col}.${a.k}`;
      if (a.t === "s") await step(w, db.createStringAttribute(DB, col, a.k, a.n!, !!a.req, undefined, !!a.arr));
      else if (a.t === "i") await step(w, db.createIntegerAttribute(DB, col, a.k, !!a.req));
      else if (a.t === "f") await step(w, db.createFloatAttribute(DB, col, a.k, false));
      else await step(w, db.createDatetimeAttribute(DB, col, a.k, false));
    }
    let ready = false;
    for (let t = 0; t < 8 && !ready; t++) { const r = await db.listAttributes(DB, col); ready = r.attributes.every((x: any) => x.status === "available"); if (!ready) await sleep(2000); }
    if (!ready) { pending = true; log.push(`waiting: ${col} attributes still building, reload in a few seconds`); continue; }
    for (const [key, type, cols] of idx) await step(`index ${col}.${key}`, db.createIndex(DB, col, key, type as any, cols));
  }
  return NextResponse.json({ done: errors === 0 && !pending, errors, pending, log });
}
