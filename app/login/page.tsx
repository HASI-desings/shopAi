"use client";
import { useState } from "react";
import { Nav } from "@/components/Brand";
const post = async (a: string, b: object) => { const r = await fetch(`/api/auth/${a}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); return { ok: r.ok, data: await r.json() }; };
export default function Login() {
  const [mode, setMode] = useState<"in" | "up">("up"), [email, setEmail] = useState(""), [pw, setPw] = useState(""), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const r = await post(mode === "up" ? "signup" : "signin", { email, password: pw });
    if (r.ok) location.href = "/dashboard"; else setMsg(r.data.error); setBusy(false);
  }
  async function reset() { if (!email) return setMsg("Enter your email first."); await post("recover", { email }); setMsg("If that email has an account, a reset link is on its way."); }
  return <div className="ledger min-h-screen"><Nav />
    <form onSubmit={submit} className="panel mx-auto mt-10 w-full max-w-sm space-y-4 p-7">
      <h1 className="font-display text-2xl font-semibold">{mode === "up" ? "Create your account" : "Sign in"}</h1>
      <input className="field" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <input className="field" type="password" required minLength={8} placeholder="Password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} />
      <button className="btn btn-primary w-full" disabled={busy}>{mode === "up" ? "Create account" : "Sign in"}</button>
      {msg && <p role="status" className="text-sm text-amber">{msg}</p>}
      <div className="flex justify-between text-sm text-mist"><button type="button" onClick={() => setMode(mode === "up" ? "in" : "up")} className="hover:text-paper">{mode === "up" ? "Have an account? Sign in" : "New here? Create account"}</button>{mode === "in" && <button type="button" onClick={reset} className="hover:text-paper">Reset password</button>}</div>
    </form></div>;
}
