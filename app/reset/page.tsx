"use client";
import { useState } from "react";
import { Nav } from "@/components/Brand";
export default function Reset() {
  const [pw, setPw] = useState(""), [msg, setMsg] = useState(""), [done, setDone] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); const q = new URLSearchParams(location.search);
    const r = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: q.get("userId"), secret: q.get("secret"), password: pw }) });
    if (r.ok) setDone(true); else setMsg((await r.json()).error);
  }
  return <div className="ledger min-h-screen"><Nav /><form onSubmit={submit} className="panel mx-auto mt-10 w-full max-w-sm space-y-4 p-7">
    <h1 className="font-display text-2xl font-semibold">Choose a new password</h1>
    {done ? <p className="text-sm text-tide">Password updated. <a className="underline" href="/login">Sign in</a></p> : <>
      <input className="field" type="password" required minLength={8} placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
      <button className="btn btn-primary w-full">Update password</button>{msg && <p role="alert" className="text-sm text-amber">{msg}</p>}</>}</form></div>;
}
