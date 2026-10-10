import { admin, DB, C } from "./appwrite";
import { LIMITS } from "./plans";
import { Query } from "node-appwrite";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const period = () => new Date().toISOString().slice(0, 7).replace("-", "");
async function getDoc(id: string): Promise<any | null> { try { return await admin().db.getDocument(DB, C.counters, id); } catch (e: any) { if (e.code === 404) return null; throw e; } }
const put = (id: string, data: object, exists: boolean) => { const { db } = admin(); return exists ? db.updateDocument(DB, C.counters, id, data) : db.createDocument(DB, C.counters, id, data); };

export async function getPlan(owner: string) {
  const r = await admin().db.listDocuments(DB, C.subs, [Query.equal("owner_id", [owner]), Query.orderDesc("$createdAt"), Query.limit(10)]);
  const id = r.documents.find((d: any) => d.status === "active")?.plan_id ?? "free";
  return { id: id as string, ...(LIMITS[id] ?? LIMITS.free) };
}
// Per-key rate limit. Best effort (read-modify-write); the money-relevant quota below is strictly atomic.
export async function hitRate(bucket: string, limit: number, windowSec = 60) {
  const id = `rl_${bucket}`, win = Math.floor(Date.now() / (windowSec * 1000)), d = await getDoc(id);
  const hits = d && d.win === win ? d.hits : 0;
  if (hits >= limit) return false;
  await put(id, { win, hits: hits + 1 }, !!d); return true;
}
// Appwrite has no transactions, so quota updates are serialised per owner with a mutex built on unique document IDs
// (creating a document whose ID exists fails with 409, which is atomic). Stale locks (>10s) are broken.
async function withLock<T>(owner: string, fn: () => Promise<T>): Promise<T> {
  const { db } = admin(), id = `l_${owner}`; let got = false;
  for (let i = 0; i < 40 && !got; i++) {
    try { await db.createDocument(DB, C.counters, id, { locked_at: new Date().toISOString() }); got = true; }
    catch (e: any) {
      if (e.code !== 409) throw e;
      const d = await getDoc(id);
      if (d && Date.now() - Date.parse(d.locked_at) > 10_000) await db.deleteDocument(DB, C.counters, id).catch(() => {});
      await sleep(40 + Math.random() * 80);
    }
  }
  if (!got) throw new Error("quota lock timeout");
  try { return await fn(); } finally { await db.deleteDocument(DB, C.counters, id).catch(() => {}); }
}
export const consumeQuota = (owner: string, units: number, limit: number) => withLock(owner, async () => {
  const id = `q_${owner}_${period()}`, d = await getDoc(id), used = d?.used ?? 0;
  if (units > limit || used + units > limit) return { allowed: false, used, quota: limit };
  await put(id, { used: used + units }, !!d); return { allowed: true, used: used + units, quota: limit };
});
export const refundQuota = (owner: string, units: number) => withLock(owner, async () => {
  const id = `q_${owner}_${period()}`, d = await getDoc(id);
  if (d) await put(id, { used: Math.max(0, (d.used ?? 0) - units) }, true);
});
export async function usedThisPeriod(owner: string) { return (await getDoc(`q_${owner}_${period()}`))?.used ?? 0; }
