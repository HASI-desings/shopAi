"use client";
import { useMemo, useState } from "react";
import { computeMetrics } from "@/lib/calc";
const fmt = (n: number | null) => (n === null ? "n/a" : n.toLocaleString("en-PK", { maximumFractionDigits: 0 }));
function Slider({ label, value, set, min, max, step = 50 }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number }) {
  return <label className="block"><div className="flex justify-between text-xs text-mist"><span>{label}</span><span className="font-mono text-paper">{value.toLocaleString()}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(+e.target.value)} className="mt-1.5 w-full" aria-label={label} /></label>;
}
export default function LedgerDemo() {
  const [price, setPrice] = useState(1800), [cost, setCost] = useState(1100), [qty, setQty] = useState(40), [disc, setDisc] = useState(2000), [rent, setRent] = useState(12000);
  const r = useMemo(() => computeMetrics([{ product_id: "p001", product_name: "Cotton Shirt", quantity: qty, unit_price: price, unit_cost: cost, discount: disc }], [{ category: "rent", amount: rent }]), [price, cost, qty, disc, rent]);
  const gm = r.metrics.gross_margin_percent, loss = (r.metrics.operating_profit_estimate ?? 0) < 0;
  return <div className="panel overflow-hidden shadow-[0_40px_120px_-40px_rgba(62,224,193,.25)]">
    <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-xs text-mist"><span className="font-mono">POST /api/v1/analytics/profit</span><span className="rounded bg-tide/10 px-2 py-0.5 text-tide">200 OK</span></div>
    <div className="grid md:grid-cols-2">
      <div className="space-y-4 border-b border-line p-5 md:border-b-0 md:border-r">
        <p className="font-mono text-[13px] leading-6 text-mist">{`{ "currency": "PKR",`}<br />{`  "sales": [{ "product_name": "Cotton Shirt",`}<br />
          {`    "quantity": `}<b className="text-paper">{qty}</b>{`, "unit_price": `}<b className="text-paper">{price}</b>{`,`}<br />{`    "unit_cost": `}<b className="text-paper">{cost}</b>{`, "discount": `}<b className="text-paper">{disc}</b>{` }],`}<br />
          {`  "expenses": [{ "category": "rent", "amount": `}<b className="text-paper">{rent}</b>{` }] }`}</p>
        <Slider label="Unit price" value={price} set={setPrice} min={500} max={5000} />
        <Slider label="Unit cost" value={cost} set={setCost} min={200} max={4000} />
        <Slider label="Quantity sold" value={qty} set={setQty} min={1} max={200} step={1} />
        <Slider label="Line discount (total)" value={disc} set={setDisc} min={0} max={20000} step={500} />
        <Slider label="Rent" value={rent} set={setRent} min={0} max={60000} step={1000} />
      </div>
      <div className="flex flex-col justify-between gap-6 bg-navy/60 p-5">
        <div><p className="text-xs text-mist">Gross margin</p>
          <p className={`font-display text-7xl font-semibold leading-none tracking-tight ${(gm ?? 0) < 0 ? "text-loss" : "text-tide"}`}>{gm === null ? "n/a" : gm.toFixed(1)}<span className="text-3xl text-mist">%</span></p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-tide transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, gm ?? 0))}%` }} /></div></div>
        <dl className="space-y-2 text-sm">{[["Net revenue", r.metrics.net_revenue], ["Cost of goods sold", r.metrics.cost_of_goods_sold], ["Gross profit", r.metrics.gross_profit], ["Operating profit (estimate)", r.metrics.operating_profit_estimate]].map(([k, v]) =>
          <div key={k as string} className="flex justify-between border-b border-line/70 pb-2"><dt className="text-mist">{k}</dt><dd className={`font-mono ${k === "Operating profit (estimate)" && loss ? "text-loss" : ""}`}>PKR {fmt(v as number | null)}</dd></div>)}</dl>
        <p className="text-xs leading-5 text-mist">Calculated live in your browser by the same engine the API runs. AI recommendations are generated server-side when you call the insights endpoints.</p>
      </div></div></div>;
}
