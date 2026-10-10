import { Client, Account, Databases, Users, Query, ID, Models } from "node-appwrite";
import { cookies } from "next/headers";
export { Query, ID };
export const DB = "meeru";
export const C = { counters: "counters", projects: "projects", keys: "api_keys", usage: "api_usage", subs: "subscriptions", audit: "audit_logs" } as const;
const ENDPOINT = process.env.APPWRITE_ENDPOINT ?? "https://nyc.cloud.appwrite.io/v1";
const PROJECT = process.env.APPWRITE_PROJECT_ID ?? "6a632cec0020e9021e91";
export const SESSION_COOKIE = `a_session_${PROJECT}`;
const base = () => new Client().setEndpoint(ENDPOINT).setProject(PROJECT);
export const guest = () => new Account(base());
export const withSession = (secret: string) => new Account(base().setSession(secret));
// Server-only: uses the secret API key. Collections have no client permissions, so this is the only way in.
export function admin() { const c = base().setKey(process.env.APPWRITE_API_KEY!); return { db: new Databases(c), users: new Users(c), account: new Account(c) }; }
export async function requireUser(): Promise<Models.User<Models.Preferences> | null> {
  const s = cookies().get(SESSION_COOKIE)?.value; if (!s) return null;
  try { return await withSession(s).get(); } catch { return null; }
}
// Appwrite doc -> plain object with `id` / `created_at` (and `scopes` exposed as `permissions`).
export function norm(d: any): any {
  const { $id, $createdAt, $updatedAt, $permissions, $collectionId, $databaseId, $sequence, ...rest } = d;
  const o: any = { id: $id, created_at: $createdAt, ...rest };
  if (o.scopes) { o.permissions = o.scopes; delete o.scopes; }
  return o;
}
