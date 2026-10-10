import { NextResponse } from "next/server";
import { guest } from "@/lib/appwrite";
export async function GET(req: Request) {
  const u = new URL(req.url), userId = u.searchParams.get("userId"), secret = u.searchParams.get("secret");
  if (userId && secret) await guest().updateVerification(userId, secret).catch(() => {});
  return NextResponse.redirect(new URL("/dashboard", u.origin));
}
