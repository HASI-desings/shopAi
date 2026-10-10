"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Copy, Check, Plus, RotateCw, Trash2, Play } from "lucide-react";
import { Mark } from "./Brand";

const PERMS = ["analytics:read", "analytics:ai", "usage:read", "projects:read"];
const SAMPLE = { currency: "PKR", period: { start: "2026-10-01", end: "2026-10-07" },
  sales: [{ product_id: "p001", product_name: "Cotton Shirt", quantity: 40, unit_price: 1800, unit_cost: 1100, discount: 2000, date: "2026-10-02" }, { product_id: "p002", product_name: "Jeans", quantity: 15, unit_price: 3500, unit_cost: 2200, date: "2026-10-04" }],
  expenses: [{ category: "rent", amount: 12000 }, { category: "utilities", amount: 2500 }], inventory: [{ product_id: "p001", stock: 60, lead_time_days: 7 }], question: "Which product should I look at first?" };
const ENDPOINTS = ["profit", "margins", "products", "inventory", "sales-trends", "business-insights", "ask"];
const jf = async (url: string, method = "GET", body?: unknown) => { const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); return { ok: r.ok, data: await r.json() }; };

export default function Dashboard() {
  const [tab, setTab] = useState<"overview" | "keys" | "playground">("overview");
  const [d, setD] = useState<any>(null);
  const load = useCallback(async () => { const r = await jf("/api/dashboard/overview"); if (r.ok) setD(r.data); }, []);
  useEffect(() => { load(); }, [load]);
  async function signOut() { await jf("/api/auth/signout", "POST", {}); location.href = "/"; }
  return <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
    <aside className="border-b border-line bg-navy/60 p-4 lg:border-b-0 lg:border-r lg:p-6">
      <div className="flex items-center gap-2 font-display text-lg font-semibold"><Mark size={22} />meeru</div>
      <nav className="mt-4 flex gap-1 lg:mt-8 lg:flex-col">{(["overview", "keys", "playground"] as const).map((t) =>
        <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-2 text-left text-sm capitalize ${tab === t ? "bg-tide/10 text-tide" : "text-mist hover:text-paper"}`}>{t === "keys" ? "Projects & keys" : t}</button>)}
        <a href="/docs" className="rounded-lg px-3 py-2 text-sm text-mist hover:text-paper">Docs</a>
        <button onClick={signOut} className="rounded-lg px-3 py-2 text-left text-sm text-mist hover:text-paper lg:mt-8">Sign out</button></nav>
      {d && <p className="mt-6 hidden truncate text-xs text-mist lg:block">{d.email}</p>}
    </aside>
    <main className="p-5 sm:p-8">{d && !d.verified && <div role="status" className="mb-6 rounded-lg border border-amber/40 bg-amber/10 p-3 text-sm text-amber">Verify your email to create API keys. <button className="underline" onClick={() => jf("/api/auth/resend", "POST", {})}>Resend email</button></div>}{!d ? <p className="text-mist">Loading…</p> : tab === "overview" ? <Overview d={d} go={() => setTab("keys")} /> : tab === "keys" ? <Keys d={d} reload={load} /> : <Playground d={d} reload={load} />}</main></div>;
}

function Overview({ d, go }: { d: any; go: () => void }) {
  const u: any[] = d.usage, ok = u.filter((x) => x.status_code < 400).length, tokens = u.reduce((a, x) => a + (x.input_tokens ?? 0) + (x.output_tokens ?? 0), 0);
  const cost = u.reduce((a, x) => a + Number(x.estimated_provider_cost ?? 0), 0), hasCost = u.some((x) => x.estimated_provider_cost != null);
  const series = useMemo(() => { const m = new Map<string, number>(); for (let i = 29; i >= 0; i--) m.set(new Date(Date.now() - i * 864e5).toISOString().slice(5, 10), 0); u.forEach((x) => { const k = x.created_at.slice(5, 10); if (m.has(k)) m.set(k, m.get(k)! + 1); }); return [...m].map(([day, requests]) => ({ day, requests })); }, [u]);
  const pctUsed = Math.min(100, (d.used / d.plan.request_limit) * 100);
  const Stat = ({ k, v, sub }: { k: string; v: string | number; sub?: string }) => <div className="panel p-5"><p className="text-xs text-mist">{k}</p><p className="mt-2 font-display text-3xl font-semibold">{v}</p>{sub && <p className="mt-1 text-xs text-mist">{sub}</p>}</div>;
  if (!u.length && !d.keys.length) return <div className="panel mx-auto mt-10 max-w-xl p-8"><h1 className="font-display text-2xl font-semibold">Make your first request</h1>
    <p className="mt-3 text-mist">Create a project, generate a key, then send sales data from your server or try it in the Playground. Your usage will appear here.</p><button className="btn btn-primary mt-6" onClick={go}>Create a project and key</button></div>;
  return <div className="space-y-6"><h1 className="font-display text-3xl font-semibold">Overview</h1>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat k="Requests (30 days)" v={u.length} sub={`${ok} succeeded · ${u.length - ok} failed`} /><Stat k="AI tokens" v={tokens.toLocaleString()} sub={hasCost ? `≈ $${cost.toFixed(4)} provider cost` : "Cost estimate needs pricing env vars"} />
      <Stat k="Active keys" v={d.keys.filter((k: any) => k.status === "active").length} sub={`${d.projects.length} project(s)`} /><Stat k="Quota left" v={Math.max(0, d.plan.request_limit - d.used).toLocaleString()} sub={`${d.used.toLocaleString()} of ${d.plan.request_limit.toLocaleString()} units · ${d.plan.name}`} /></div>
    <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className={`h-full ${pctUsed > 85 ? "bg-amber" : "bg-tide"}`} style={{ width: `${pctUsed}%` }} /></div>
    <div className="panel p-5"><p className="mb-4 text-sm text-mist">Requests per day</p><div className="h-56"><ResponsiveContainer><AreaChart data={series}>
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3EE0C1" stopOpacity={0.35} /><stop offset="1" stopColor="#3EE0C1" stopOpacity={0} /></linearGradient></defs>
      <XAxis dataKey="day" stroke="#8FA0BC" fontSize={11} tickLine={false} axisLine={false} interval={4} /><YAxis stroke="#8FA0BC" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
      <Tooltip contentStyle={{ background: "#0E1A2E", border: "1px solid #1B2A45", borderRadius: 8 }} /><Area dataKey="requests" stroke="#3EE0C1" strokeWidth={2} fill="url(#g)" /></AreaChart></ResponsiveContainer></div></div>
    <div className="panel overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-mist"><tr><th className="p-3">Time</th><th>Endpoint</th><th>Status</th><th>Units</th><th>Duration</th></tr></thead><tbody>
      {u.slice(0, 10).map((x, i) => <tr key={i} className="border-t border-line"><td className="p-3 text-mist">{new Date(x.created_at).toLocaleString()}</td><td className="font-mono text-xs">{x.endpoint.replace("/api/v1/analytics/", "")}</td>
        <td className={x.status_code < 400 ? "text-tide" : "text-loss"}>{x.status_code}</td><td>{x.request_units}</td><td>{x.duration_ms} ms</td></tr>)}</tbody></table></div></div>;
}

function Keys({ d, reload }: { d: any; reload: () => void }) {
  const [p, setP] = useState({ name: "", environment: "development" }), [k, setK] = useState({ name: "", project_id: "", permissions: ["analytics:read"] as string[] });
  const [fresh, setFresh] = useState<string | null>(null), [copied, setCopied] = useState(false), [err, setErr] = useState("");
  const act = async (url: string, method: string, body?: unknown) => { setErr(""); const r = await jf(url, method, body); if (!r.ok) setErr(r.data.error ?? "Something went wrong"); else { if (r.data.key) setFresh(r.data.key); reload(); } return r; };
  return <div className="space-y-8"><h1 className="font-display text-3xl font-semibold">Projects & keys</h1>
    {err && <p role="alert" className="rounded-lg border border-loss/40 bg-loss/10 p-3 text-sm text-loss">{err}</p>}
    {fresh && <div className="rounded-xl border border-amber/50 bg-amber/10 p-5"><p className="text-sm font-medium text-amber">Copy this key now. For security, the complete key will not be displayed again.</p>
      <div className="mt-3 flex items-center gap-2"><code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-ink p-3 font-mono text-xs">{fresh}</code>
        <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(fresh); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? <><Check size={16} />Copied</> : <><Copy size={16} />Copy</>}</button>
        <button className="btn btn-ghost" onClick={() => setFresh(null)}>Done</button></div></div>}
    <section className="panel p-5"><h2 className="font-display text-lg font-medium">Projects</h2>
      <form className="mt-4 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); act("/api/dashboard/projects", "POST", p).then(() => setP({ ...p, name: "" })); }}>
        <input className="field max-w-xs" required placeholder="Project name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        <select className="field w-auto" value={p.environment} onChange={(e) => setP({ ...p, environment: e.target.value })}><option>development</option><option>production</option></select><button className="btn btn-primary"><Plus size={16} />Create project</button></form>
      <ul className="mt-4 divide-y divide-line">{d.projects.map((x: any) => <li key={x.id} className="flex items-center justify-between py-3 text-sm"><span>{x.name} <span className="ml-2 rounded bg-line px-2 py-0.5 text-xs text-mist">{x.environment}</span></span>
        <button aria-label="Delete project" className="text-mist hover:text-loss" onClick={() => confirm(`Delete "${x.name}" and its keys?`) && act(`/api/dashboard/projects?id=${x.id}`, "DELETE")}><Trash2 size={16} /></button></li>)}</ul></section>
    <section className="panel p-5"><h2 className="font-display text-lg font-medium">API keys</h2>
      {d.projects.length ? <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); act("/api/dashboard/keys", "POST", k); }}>
        <div className="flex flex-wrap gap-2"><input className="field max-w-xs" required placeholder="Key name" value={k.name} onChange={(e) => setK({ ...k, name: e.target.value })} />
          <select className="field w-auto" required value={k.project_id} onChange={(e) => setK({ ...k, project_id: e.target.value })}><option value="">Choose project</option>{d.projects.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
        <div className="flex flex-wrap gap-4 text-sm">{PERMS.map((x) => <label key={x} className="flex items-center gap-2"><input type="checkbox" className="accent-[#3EE0C1]" checked={k.permissions.includes(x)} onChange={(e) => setK({ ...k, permissions: e.target.checked ? [...k.permissions, x] : k.permissions.filter((y) => y !== x) })} />{x}</label>)}</div>
        <button className="btn btn-primary" disabled={!k.permissions.length}>Generate key</button></form> : <p className="mt-3 text-sm text-mist">Create a project first.</p>}
      <ul className="mt-5 divide-y divide-line">{d.keys.map((x: any) => <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><span className={x.status === "revoked" ? "text-mist line-through" : ""}>{x.name}</span> <code className="ml-2 font-mono text-xs text-mist">{x.public_prefix}_…</code>
        <p className="text-xs text-mist">Created {new Date(x.created_at).toLocaleDateString()} · {x.last_used_at ? `last used ${new Date(x.last_used_at).toLocaleString()}` : "never used"}</p></div>
        {x.status === "active" && <div className="flex gap-2"><button className="btn btn-ghost !py-1.5" onClick={() => act("/api/dashboard/keys", "POST", { action: "rotate", id: x.id })}><RotateCw size={14} />Rotate</button>
          <button className="btn btn-ghost !py-1.5 hover:!border-loss hover:!text-loss" onClick={() => confirm("Revoke this key now? Apps using it will stop working.") && act(`/api/dashboard/keys?id=${x.id}`, "DELETE")}>Revoke</button></div>}</li>)}</ul></section></div>;
}

function Playground({ d, reload }: { d: any; reload: () => void }) {
  const [project, setProject] = useState(d.projects[0]?.id ?? ""), [ep, setEp] = useState("profit"), [body, setBody] = useState(JSON.stringify(SAMPLE, null, 2)), [out, setOut] = useState<any>(null), [busy, setBusy] = useState(false);
  async function run() { setBusy(true); const r = await jf("/api/dashboard/playground", "POST", { endpoint: ep, project_id: project, body }); setOut(r.data); setBusy(false); reload(); }
  const curl = `curl https://meeru.shop/api/v1/analytics/${ep} \\\n  -H "Authorization: Bearer $MEERU_API_KEY" -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(JSON.parse(body.trim() ? safe(body) : "{}"))}'`;
  return <div className="space-y-5"><h1 className="font-display text-3xl font-semibold">Playground</h1>
    <p className="max-w-2xl text-sm text-mist">Runs real requests through your signed-in session; no key needed. The pre-filled data is demo data, and requests count toward your quota and usage.</p>
    {!d.projects.length ? <p className="text-amber">Create a project first.</p> : <>
      <div className="flex flex-wrap gap-2"><select className="field w-auto" value={project} onChange={(e) => setProject(e.target.value)}>{d.projects.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select className="field w-auto" value={ep} onChange={(e) => setEp(e.target.value)}>{ENDPOINTS.map((x) => <option key={x}>{x}</option>)}</select>
        <button className="btn btn-primary" onClick={run} disabled={busy}><Play size={16} />{busy ? "Running…" : "Send request"}</button></div>
      <div className="grid gap-4 xl:grid-cols-2"><textarea className="field h-[28rem] font-mono text-xs leading-5" spellCheck={false} value={body} onChange={(e) => setBody(e.target.value)} aria-label="Request JSON" />
        <div className="panel h-[28rem] overflow-auto p-4">{out ? <><p className="mb-2 text-xs"><span className={out.status < 400 ? "text-tide" : "text-loss"}>{out.status}</span> <span className="text-mist">· {out.duration_ms} ms · {out.response?.meta?.usage?.requests_charged ?? 0} unit(s)</span></p><pre className="font-mono text-xs leading-5 text-mist">{JSON.stringify(out.response ?? out, null, 2)}</pre></> : <p className="text-sm text-mist">The response appears here.</p>}</div></div>
      <details className="panel p-4 text-sm"><summary className="text-mist">Equivalent cURL</summary><pre className="mt-3 overflow-x-auto font-mono text-xs text-mist">{curl}</pre></details></>}</div>;
}
function safe(s: string) { try { JSON.parse(s); return s; } catch { return "{}"; } }
