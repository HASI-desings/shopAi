import { randomUUID } from "crypto";
import { admin, DB, C, ID } from "./appwrite";
import { consumeQuota, hitRate, refundQuota } from "./quota";
import { requestSchema } from "./schemas";
import { computeMetrics, dailyTrend, inventoryDays, periodDays } from "./calc";
import { analyze, ProviderError } from "./claude";

export type Principal = { ownerId: string; projectId: string; keyId: string | null; permissions: string[] };
export const ENDPOINTS: Record<string, { perm: string; ai: boolean }> = {
  profit: { perm: "analytics:read", ai: false }, margins: { perm: "analytics:read", ai: false }, products: { perm: "analytics:read", ai: false },
  inventory: { perm: "analytics:read", ai: false }, "sales-trends": { perm: "analytics:read", ai: false },
  "business-insights": { perm: "analytics:ai", ai: true }, ask: { perm: "analytics:ai", ai: true },
};
const MAX_BYTES = 1_000_000;
const fail = (status: number, code: string, message: string, request_id: string, extra: object = {}) =>
  ({ status, body: { success: false, error: { code, message, ...extra }, meta: { request_id } } });

type PlanLimits = { request_limit: number; rate_limit: number };
export async function runEndpoint(name: string, p: Principal, rawText: string, plan: PlanLimits) {
  const t0 = Date.now(), request_id = `req_${randomUUID()}`, { db } = admin();
  const def = ENDPOINTS[name];
  let units = 0, tokens: { i?: number; o?: number; model?: string; cost?: number | null } = {};
  const log = (status: number) => db.createDocument(DB, C.usage, ID.unique(), { owner_id: p.ownerId, project_id: p.projectId, api_key_id: p.keyId, request_id, endpoint: `/api/v1/analytics/${name}`,
    status_code: status, duration_ms: Date.now() - t0, request_units: units, input_tokens: tokens.i ?? null, output_tokens: tokens.o ?? null, model_identifier: tokens.model ?? null, estimated_provider_cost: tokens.cost ?? null }).then(() => {}, () => {});
  const done = async (r: ReturnType<typeof fail>) => { await log(r.status); return r; };

  if (!def) return fail(404, "not_found", "Unknown endpoint", request_id);
  if (!p.permissions.includes(def.perm)) return done(fail(403, "forbidden", `This key lacks the ${def.perm} permission`, request_id));
  const ok = await hitRate(p.keyId ?? p.ownerId, plan.rate_limit).catch(() => true);
  if (!ok) return done(fail(429, "rate_limited", "Too many requests. Retry in a minute.", request_id));
  if (Buffer.byteLength(rawText) > MAX_BYTES) return done(fail(413, "payload_too_large", "Request body exceeds 1 MB", request_id));
  let json: unknown; try { json = JSON.parse(rawText); } catch { return done(fail(400, "invalid_json", "Body must be valid JSON", request_id)); }
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) return done(fail(422, "validation_error", "Request failed validation", request_id, { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }));
  const d = parsed.data;
  if (name === "inventory" && !d.inventory) return done(fail(422, "validation_error", "`inventory` is required for this endpoint", request_id));
  if (name === "ask" && !d.question) return done(fail(422, "validation_error", "`question` is required for this endpoint", request_id));

  units = def.ai ? Number(process.env.AI_REQUEST_UNITS ?? 5) : 1;
  let q: { allowed: boolean; used: number; quota: number };
  try { q = await consumeQuota(p.ownerId, units, plan.request_limit); } catch { units = 0; return done(fail(503, "busy", "Usage service is busy. Retry shortly.", request_id)); }
  if (!q.allowed) { const u = units; units = 0; return done(fail(429, "quota_exceeded", `Monthly quota reached (${q.used}/${q.quota}). Upgrade your plan or wait for the next period.`, request_id, { needed_units: u })); }

  const calc = computeMetrics(d.sales, d.expenses);
  const base = { currency: d.currency, period: d.period };
  let data: Record<string, unknown>;
  let model: string | null = null;
  try {
    switch (name) {
      case "profit": data = { ...base, metrics: calc.metrics, expense_breakdown: calc.expense_breakdown, data_quality_warnings: calc.data_quality_warnings }; break;
      case "margins": { const { gross_margin_percent, markup_percent, operating_margin_percent, discount_impact_percent } = calc.metrics;
        data = { ...base, metrics: { gross_margin_percent, markup_percent, operating_margin_percent, discount_impact_percent }, products: calc.products, data_quality_warnings: calc.data_quality_warnings }; break; }
      case "products": data = { ...base, products: calc.products, data_quality_warnings: calc.data_quality_warnings }; break;
      case "sales-trends": data = { ...base, ...dailyTrend(d.sales) }; break;
      case "inventory": data = { ...base, items: inventoryDays(d.sales, d.inventory!, periodDays(d.period.start, d.period.end)), data_quality_warnings: [] }; break;
      default: {
        const trusted = { ...base, ...calc, trend: dailyTrend(d.sales).series, inventory: d.inventory ? inventoryDays(d.sales, d.inventory, periodDays(d.period.start, d.period.end)) : undefined };
        const r = await analyze(trusted, d.question);
        tokens = { i: r.inputTokens, o: r.outputTokens, model: r.model, cost: r.cost }; model = r.model;
        data = { ...base, metrics: calc.metrics, products: calc.products, expense_breakdown: calc.expense_breakdown, ...r.insights, data_quality_warnings: calc.data_quality_warnings };
      }
    }
  } catch (e) {
    await refundQuota(p.ownerId, units).catch(() => {}); units = 0; // provider failures are not billed
    if (e instanceof ProviderError) return done(fail(502, "ai_provider_error", e.message + ". You were not charged.", request_id));
    return done(fail(500, "internal_error", "Unexpected error", request_id));
  }
  await log(200);
  return { status: 200, body: { success: true, data, meta: { request_id, model, usage: { requests_charged: units } } } };
}
