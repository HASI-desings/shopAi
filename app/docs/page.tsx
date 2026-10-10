import { Nav } from "@/components/Brand";
import { ENDPOINT_LIST } from "@/lib/plans";
const body = `{
  "currency": "PKR",
  "period": { "start": "2026-10-01", "end": "2026-10-07" },
  "sales": [{ "product_id": "p001", "product_name": "Cotton Shirt", "quantity": 40, "unit_price": 1800, "unit_cost": 1100, "discount": 2000, "returned_quantity": 0, "date": "2026-10-02" }],
  "expenses": [{ "category": "rent", "amount": 12000 }],
  "inventory": [{ "product_id": "p001", "stock": 120, "lead_time_days": 7 }],
  "question": "Which product should I reprice first?"
}`;
const errors = [["400", "invalid_json", "Body isn't valid JSON"], ["401", "missing_api_key / invalid_api_key / revoked_api_key / expired_api_key", "Authentication failed"], ["403", "forbidden", "Key lacks the endpoint's permission"], ["413", "payload_too_large", "Body over 1 MB"], ["422", "validation_error", "Schema failed; see `issues`"], ["429", "rate_limited / quota_exceeded", "Slow down or upgrade"], ["502", "ai_provider_error", "Claude failed; you are not charged"]];
const Code = ({ children }: { children: string }) => <pre className="my-4 overflow-x-auto rounded-xl border border-line bg-panel p-4 font-mono text-[13px] leading-6 text-mist"><code>{children}</code></pre>;
export default function Docs() {
  const links = ["quickstart", "auth", "conventions", "endpoints", "errors", "security"];
  return <div><Nav />
    <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 pt-6 sm:px-8 lg:grid-cols-[200px_1fr]">
      <aside className="top-6 h-fit text-sm lg:sticky"><ul className="flex gap-4 overflow-x-auto lg:flex-col lg:gap-2">{links.map((l) => <li key={l}><a href={`#${l}`} className="capitalize text-mist hover:text-tide">{l}</a></li>)}</ul></aside>
      <article className="max-w-3xl space-y-14 leading-7 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-semibold [&_p]:mt-3 [&_p]:text-mist [&_code]:font-mono [&_code]:text-tide">
        <section id="quickstart"><h2>Quick start</h2><p>Create an account, add a project, generate a key under <b>API Keys</b>, then call the API from your server.</p>
          <Code>{`curl https://meeru.shop/api/v1/analytics/profit \\
  -H "Authorization: Bearer $MEERU_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"currency":"PKR","period":{"start":"2026-10-01","end":"2026-10-07"},"sales":[{"product_id":"p1","product_name":"Shirt","quantity":10,"unit_price":1800,"unit_cost":1100}]}'`}</Code></section>
        <section id="auth"><h2>Authentication</h2><p>Send <code>Authorization: Bearer meeru_live_…</code>. Keys starting <code>meeru_test_</code> belong to development projects. Keep keys in server-side environment variables, never in browser or mobile code.</p></section>
        <section id="conventions"><h2>Accounting conventions</h2><p>Prices and costs <b>exclude tax</b>. <code>discount</code> is a <b>line total</b>, not per unit, and is not reversed on returns. Returned units are refunded at <code>unit_price</code> and assumed restocked. Shipping, fees and taxes aren't modelled. If any <code>unit_cost</code> is missing, COGS, gross profit and margins return <code>null</code> with a warning. Gross margin = gross profit ÷ net revenue; markup = profit ÷ cost. Operating profit is an estimate, not audited.</p><Code>{body}</Code></section>
        <section id="endpoints"><h2>Endpoints</h2><p>All <code>POST /api/v1/analytics/&lt;name&gt;</code> with the body above. <code>inventory</code> requires <code>inventory</code>; <code>ask</code> requires <code>question</code>. Also <code>GET /api/v1/usage</code> (usage:read), <code>GET /api/v1/projects</code> (projects:read), <code>GET /api/v1/health</code>.</p>
          <div className="mt-4 divide-y divide-line border-y border-line text-sm">{ENDPOINT_LIST.map(([n, d, p, c]) => <div key={n} className="grid gap-1 py-3 sm:grid-cols-[170px_1fr_auto]"><code>{n}</code><span className="text-mist">{d}</span><span className="text-xs text-mist">{p} · {c}</span></div>)}</div></section>
        <section id="errors"><h2>Errors</h2><p>Every error is <code>{`{ "success": false, "error": { "code", "message" }, "meta": { "request_id" } }`}</code>.</p>
          <div className="mt-4 divide-y divide-line border-y border-line text-sm">{errors.map(([s, c, d]) => <div key={s} className="grid gap-1 py-3 sm:grid-cols-[50px_1fr_1fr]"><b>{s}</b><code className="break-words">{c}</code><span className="text-mist">{d}</span></div>)}</div></section>
        <section id="security"><h2>Security and privacy</h2><p>Insight endpoints send calculated metrics and product names to Anthropic's Claude API. Requests that fail because the AI provider is down aren't billed. Raw request payloads are not stored; only usage metadata is.</p></section>
      </article></div></div>;
}
