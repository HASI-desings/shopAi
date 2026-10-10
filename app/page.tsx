import Link from "next/link";
import { ShieldCheck, Gauge, KeyRound, Boxes } from "lucide-react";
import { Nav, Mark } from "@/components/Brand";
import LedgerDemo from "@/components/LedgerDemo";
import { PLANS } from "@/lib/plans";
import { requireUser } from "@/lib/appwrite";
const steps = [["Create a key", "Sign up, add a project, and generate a Meeru key. It is shown once and stored only as a hash."], ["Send your data", "POST sales, costs, and expenses from your server. Discounts, returns, and tax rules are explicit."], ["We calculate", "Margins, markup, and profit come from tested code, never from a language model."], ["Claude explains", "Claude reads the verified numbers and returns structured, evidence-linked recommendations."]];
const caps = [["Profit and margin", "Gross and operating profit with clear definitions, per product and overall."], ["Pricing signals", "Where discounts or low markup are eating into margin."], ["Inventory", "Days of stock left from real sales velocity, with reorder flags."], ["Sales trends", "Daily net revenue and change across the period."], ["Plain-language questions", "Ask about your own numbers and get an answer grounded in them."], ["Honest gaps", "Missing cost or stock data is reported as missing, never guessed."]];
const faq = [["Where does my data go?", "Requests are processed by Meeru. Insight endpoints send the calculated metrics and product names to Anthropic's Claude API to write the analysis. Don't send data you aren't allowed to share."], ["Can I put my key in browser code?", "No. Keep it in your server's environment variables and call Meeru from your backend."], ["What happens when Claude is unavailable?", "You get a 502 and are not charged. We never fabricate recommendations."], ["Is this audited accounting?", "No. Operating profit is an estimate from the data you send. Taxes, financing, and depreciation are excluded."]];
export default async function Home() {
  const authed = !!(await requireUser().catch(() => null));
  return <main>
    <section className="ledger overflow-hidden"><Nav authed={authed} />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-10 sm:px-8 lg:grid-cols-12 lg:pt-20">
        <div className="rise lg:col-span-5">
          <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">Your Retail Data. Your Intelligence.</h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-mist">Integrate powerful retail analytics into your applications with one API. Understand margins, uncover profit opportunities, analyze inventory, and deliver actionable recommendations powered by AI.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/login" className="btn btn-primary">Get your API key</Link><Link href="/docs" className="btn btn-ghost">Explore the API</Link></div>
        </div>
        <div className="rise lg:col-span-7" style={{ animationDelay: ".15s" }}><LedgerDemo /></div>
      </div></section>

    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8"><h2 className="font-display text-3xl font-semibold sm:text-4xl">From raw sales to a decision in four steps</h2>
      <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">{steps.map(([t, d], i) =>
        <li key={t} className="bg-navy p-6"><span className="font-mono text-sm text-tide">{i + 1}</span><h3 className="mt-6 font-display text-xl font-medium">{t}</h3><p className="mt-2 text-sm leading-6 text-mist">{d}</p></li>)}</ol>
      <pre className="mt-8 overflow-x-auto rounded-xl border border-line bg-panel p-5 font-mono text-[13px] leading-6 text-mist"><code>{`const res = await fetch("https://meeru.shop/api/v1/analytics/business-insights", {
  method: "POST",
  headers: { Authorization: \`Bearer \${process.env.MEERU_API_KEY}\`, "Content-Type": "application/json" },
  body: JSON.stringify({ currency: "PKR", period: { start: "2026-10-01", end: "2026-10-07" }, sales, expenses }),
});`}</code></pre></section>

    <section className="border-y border-line bg-navy/50"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-12">
      <h2 className="font-display text-3xl font-semibold sm:text-4xl lg:col-span-4">What the API covers</h2>
      <dl className="grid gap-x-12 sm:grid-cols-2 lg:col-span-8">{caps.map(([t, d]) => <div key={t} className="border-t border-line py-5"><dt className="font-display text-lg font-medium">{t}</dt><dd className="mt-1 text-sm leading-6 text-mist">{d}</dd></div>)}</dl></div></section>

    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8"><h2 className="font-display text-3xl font-semibold sm:text-4xl">Built so your key and your data stay yours</h2>
      <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{[[KeyRound, "Hashed keys", "Keys are random, shown once, and stored only as SHA-256 hashes."], [ShieldCheck, "Tenant isolation", "Every operation checks ownership on the server, and the database has no public access."], [Gauge, "Atomic quotas", "Usage limits are enforced in the database, so parallel requests can't overshoot."], [Boxes, "Separated engine", "Validation, math, and AI are separate steps; the model can't change your numbers."]].map(([I, t, d]: any) =>
        <li key={t}><I className="h-5 w-5 text-tide" /><h3 className="mt-4 font-display text-lg font-medium">{t}</h3><p className="mt-1 text-sm leading-6 text-mist">{d}</p></li>)}</ul></section>

    <section id="pricing" className="border-t border-line bg-navy/50"><div className="mx-auto max-w-7xl px-5 py-24 sm:px-8"><h2 className="font-display text-3xl font-semibold sm:text-4xl">Plans</h2>
      <p className="mt-3 max-w-xl text-sm text-mist">Limits come from the database and are configurable. Paid pricing and checkout aren't connected yet.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">{PLANS.map((p, i) => <div key={p.id} className={`panel p-7 ${i === 1 ? "border-tide/50" : ""}`}>
        <h3 className="font-display text-xl font-medium">{p.name}</h3><p className="mt-3 font-display text-3xl font-semibold">{p.price}</p>
        <p className="mt-1 text-sm text-mist">{p.requests}<br />{p.rate}</p><ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm">{p.points.map((x) => <li key={x}>{x}</li>)}</ul></div>)}</div></div></section>

    <section className="mx-auto max-w-3xl px-5 py-24 sm:px-8"><h2 className="font-display text-3xl font-semibold">Questions</h2>
      <div className="mt-8 divide-y divide-line border-y border-line">{faq.map(([q, a]) => <details key={q} className="group py-5"><summary className="flex justify-between font-medium">{q}<span className="text-tide transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-6 text-mist">{a}</p></details>)}</div></section>
    <footer className="border-t border-line px-5 py-10 text-sm text-mist sm:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between"><span className="flex items-center gap-2"><Mark size={20} />meeru.shop</span><Link href="/docs" className="hover:text-paper">Documentation</Link></div></footer>
  </main>;
}
