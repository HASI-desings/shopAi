import { admin, DB, C, Query } from "./appwrite";
import { parseKey, verifyKey } from "./keys";
import { getPlan } from "./quota";
import type { Principal } from "./run";
export async function authenticate(req: Request): Promise<{ principal?: Principal; plan?: Awaited<ReturnType<typeof getPlan>>; error?: { status: number; code: string; message: string } }> {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const bad = (status: number, code: string, message: string) => ({ error: { status, code, message } });
  if (!token) return bad(401, "missing_api_key", "Send `Authorization: Bearer <MEERU_API_KEY>`");
  const prefix = parseKey(token);
  if (!prefix) return bad(401, "invalid_api_key", "API key is invalid");
  const { db } = admin();
  const k: any = (await db.listDocuments(DB, C.keys, [Query.equal("public_prefix", [prefix]), Query.limit(1)])).documents[0];
  if (!k || !verifyKey(token, k.secret_hash)) return bad(401, "invalid_api_key", "API key is invalid");
  if (k.status !== "active") return bad(401, "revoked_api_key", "API key has been revoked");
  if (k.expires_at && new Date(k.expires_at) < new Date()) return bad(401, "expired_api_key", "API key has expired");
  if (!k.last_used_at || Date.now() - Date.parse(k.last_used_at) > 60_000) db.updateDocument(DB, C.keys, k.$id, { last_used_at: new Date().toISOString() }).catch(() => {});
  return { principal: { ownerId: k.owner_id, projectId: k.project_id, keyId: k.$id, permissions: k.scopes }, plan: await getPlan(k.owner_id) };
}
