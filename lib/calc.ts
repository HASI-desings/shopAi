// Deterministic financial engine. All money is handled as integer minor units (x100) to avoid float drift.
// Conventions: prices/costs exclude tax; `discount` is a TOTAL for the line (not per unit) and is not reversed on returns;
// returned units are refunded at unit_price and assumed restocked (their COGS is reversed). Shipping/fees/taxes are out of scope.
export type Sale = { product_id: string; product_name: string; quantity: number; unit_price: number; unit_cost?: number; discount?: number; returned_quantity?: number; date?: string };
export type Expense = { category: string; amount: number };
const m = (x: number) => Math.round(x * 100);
const f = (n: number) => n / 100;
const pct = (a: number, b: number) => (b > 0 ? Math.round((a * 10000) / b) / 100 : null);

export function computeMetrics(sales: Sale[], expenses: Expense[] = []) {
  let gross = 0, refunds = 0, discounts = 0, cogs = 0, units = 0;
  const missingCost = new Set<string>();
  const byProduct = new Map<string, { product_id: string; product_name: string; units_sold: number; net_revenue: number; cogs: number; costKnown: boolean }>();
  for (const s of sales) {
    const returned = s.returned_quantity ?? 0, kept = s.quantity - returned;
    const lineGross = m(s.unit_price) * s.quantity, lineRefund = m(s.unit_price) * returned, lineDisc = m(s.discount ?? 0);
    const net = lineGross - lineRefund - lineDisc;
    const known = s.unit_cost !== undefined;
    const lineCogs = known ? m(s.unit_cost!) * kept : 0;
    if (!known) missingCost.add(s.product_name);
    gross += lineGross; refunds += lineRefund; discounts += lineDisc; cogs += lineCogs; units += kept;
    const p = byProduct.get(s.product_id) ?? { product_id: s.product_id, product_name: s.product_name, units_sold: 0, net_revenue: 0, cogs: 0, costKnown: true };
    p.units_sold += kept; p.net_revenue += net; p.cogs += lineCogs; p.costKnown &&= known; byProduct.set(s.product_id, p);
  }
  const net = gross - refunds - discounts;
  const opex = expenses.reduce((a, e) => a + m(e.amount), 0);
  const costComplete = missingCost.size === 0;
  const gp = costComplete ? net - cogs : null;
  const op = gp === null ? null : gp - opex;
  const warnings: string[] = [];
  if (!costComplete) warnings.push(`Missing unit_cost for: ${[...missingCost].join(", ")}. COGS, gross profit and margins are null rather than guessed.`);
  if (net <= 0) warnings.push("Net revenue is zero or negative; margin percentages are undefined.");
  const expense_breakdown: Record<string, number> = {};
  for (const e of expenses) expense_breakdown[e.category] = f((m(expense_breakdown[e.category] ?? 0)) + m(e.amount));
  return {
    metrics: {
      gross_revenue: f(gross), refunds: f(refunds), discounts: f(discounts), net_revenue: f(net), units_sold: units,
      cost_of_goods_sold: costComplete ? f(cogs) : null, gross_profit: gp === null ? null : f(gp),
      gross_margin_percent: gp === null ? null : pct(gp, net), markup_percent: costComplete ? pct(gp!, cogs) : null,
      operating_expenses: f(opex), operating_profit_estimate: op === null ? null : f(op), operating_margin_percent: op === null ? null : pct(op, net),
      discount_impact_percent: pct(discounts, gross),
    },
    products: [...byProduct.values()].map((p) => ({
      product_id: p.product_id, product_name: p.product_name, units_sold: p.units_sold, net_revenue: f(p.net_revenue),
      gross_profit: p.costKnown ? f(p.net_revenue - p.cogs) : null, gross_margin_percent: p.costKnown ? pct(p.net_revenue - p.cogs, p.net_revenue) : null,
      markup_percent: p.costKnown ? pct(p.net_revenue - p.cogs, p.cogs) : null,
    })).sort((a, b) => b.net_revenue - a.net_revenue),
    expense_breakdown, data_quality_warnings: warnings,
  };
}

export function dailyTrend(sales: Sale[]) {
  const d = new Map<string, number>();
  for (const s of sales) if (s.date) d.set(s.date, (d.get(s.date) ?? 0) + m(s.unit_price) * (s.quantity - (s.returned_quantity ?? 0)) - m(s.discount ?? 0));
  const series = [...d.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, net_revenue: f(v) }));
  const half = Math.floor(series.length / 2);
  const sum = (a: typeof series) => a.reduce((x, y) => x + m(y.net_revenue), 0);
  const change = half >= 1 && sum(series.slice(0, half)) > 0 ? Math.round(((sum(series.slice(-half)) - sum(series.slice(0, half))) * 10000) / sum(series.slice(0, half))) / 100 : null;
  return { series, second_half_vs_first_half_percent: change, data_quality_warnings: series.length ? [] : ["No sales rows include a `date`; trends cannot be calculated."] };
}

export function inventoryDays(sales: Sale[], inv: { product_id: string; stock: number; lead_time_days?: number }[], periodDays: number) {
  const sold = new Map<string, number>();
  for (const s of sales) sold.set(s.product_id, (sold.get(s.product_id) ?? 0) + s.quantity - (s.returned_quantity ?? 0));
  return inv.map((i) => {
    const velocity = (sold.get(i.product_id) ?? 0) / periodDays;
    const days = velocity > 0 ? Math.round((i.stock / velocity) * 10) / 10 : null;
    return { product_id: i.product_id, stock: i.stock, units_per_day: Math.round(velocity * 100) / 100, days_of_stock_remaining: days,
      reorder_recommended: days !== null && i.lead_time_days !== undefined ? days <= i.lead_time_days : null,
      note: days === null ? "No sales in the period; days of stock is undefined." : undefined };
  });
}
export const periodDays = (s: string, e: string) => Math.round((Date.parse(e) - Date.parse(s)) / 864e5) + 1;
