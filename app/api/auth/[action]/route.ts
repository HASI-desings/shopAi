import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { admin, guest, withSession, ID, SESSION_COOKIE } from "@/lib/appwrite";
const cred = z.object({ email: z.string().email().max(120), password: z.string().min(8).max(128) });
const origin = (req: Request) => process.env.APP_URL ?? new URL(req.url).origin;
const err = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s });
function setSession(s: { secret: string; expire: string }) {
  cookies().set(SESSION_COOKIE, s.secret, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", expires: new Date(s.expire) });
}
export async function POST(req: Request, { params }: { params: { action: string } }) {
  const body = await req.json().catch(() => ({}));
  const { users, account } = admin();
  try {
    switch (params.action) {
      case "signup": {
        const c = cred.safeParse(body); if (!c.success) return err("Enter a valid email and a password of 8+ characters.", 422);
        await users.create(ID.unique(), c.data.email, undefined, c.data.password, c.data.email.split("@")[0]);
        const s = await account.createEmailPasswordSession(c.data.email, c.data.password); setSession(s);
        await withSession(s.secret).createVerification(`${origin(req)}/auth/verify`).catch(() => {});
        return NextResponse.json({ ok: true });
      }
      case "signin": {
        const c = cred.safeParse(body); if (!c.success) return err("Invalid email or password.", 401);
        setSession(await account.createEmailPasswordSession(c.data.email, c.data.password)); return NextResponse.json({ ok: true });
      }
      case "signout": {
        const s = cookies().get(SESSION_COOKIE)?.value; if (s) await withSession(s).deleteSession("current").catch(() => {});
        cookies().delete(SESSION_COOKIE); return NextResponse.json({ ok: true });
      }
      case "resend": {
        const s = cookies().get(SESSION_COOKIE)?.value; if (!s) return err("Sign in required", 401);
        await withSession(s).createVerification(`${origin(req)}/auth/verify`); return NextResponse.json({ ok: true });
      }
      case "recover": { // always succeeds, so emails can't be enumerated
        const e = z.string().email().safeParse(body.email);
        if (e.success) await guest().createRecovery(e.data, `${origin(req)}/reset`).catch(() => {});
        return NextResponse.json({ ok: true });
      }
      case "reset": {
        const r = z.object({ userId: z.string().min(1), secret: z.string().min(1), password: z.string().min(8).max(128) }).safeParse(body);
        if (!r.success) return err("Reset link is invalid or the password is too short.", 422);
        await guest().updateRecovery(r.data.userId, r.data.secret, r.data.password); return NextResponse.json({ ok: true });
      }
      default: return err("Not found", 404);
    }
  } catch (e: any) {
    if (e.code === 409) return err("An account with this email already exists.", 409);
    if (e.code === 401) return err("Invalid email or password.", 401);
    if (e.code === 429) return err("Too many attempts. Wait a minute and try again.", 429);
    return err("Something went wrong. Try again.", 500);
  }
}
