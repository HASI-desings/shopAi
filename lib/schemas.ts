import { z } from "zod";
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const num = z.number().finite().nonnegative();
export const sale = z.object({ product_id: z.string().min(1).max(64), product_name: z.string().min(1).max(120), quantity: z.number().int().positive(), unit_price: num,
  unit_cost: num.optional(), discount: num.optional(), returned_quantity: z.number().int().nonnegative().optional(), date: date.optional() })
  .refine((s) => (s.returned_quantity ?? 0) <= s.quantity, { message: "returned_quantity cannot exceed quantity" });
export const requestSchema = z.object({
  currency: z.string().length(3).transform((c) => c.toUpperCase()),
  period: z.object({ start: date, end: date }).refine((p) => p.end >= p.start, { message: "period.end must be on or after period.start" }),
  sales: z.array(sale).min(1).max(1000),
  expenses: z.array(z.object({ category: z.string().min(1).max(60), amount: num })).max(200).default([]),
  inventory: z.array(z.object({ product_id: z.string(), stock: z.number().int().nonnegative(), lead_time_days: z.number().nonnegative().optional() })).max(1000).optional(),
  question: z.string().min(3).max(500).optional(),
});
const conf = z.object({ level: z.enum(["low", "medium", "high"]), rationale: z.string() });
export const insightSchema = z.object({
  executive_summary: z.string(), key_findings: z.array(z.string()),
  recommendations: z.array(z.object({ title: z.string(), observation: z.string(), evidence: z.string(), suggested_action: z.string(), expected_impact: z.string(), confidence: conf, additional_data_needed: z.string() })),
  risks: z.array(z.string()), answer: z.string().optional(), limitations: z.string(),
});
export type Insights = z.infer<typeof insightSchema>;
