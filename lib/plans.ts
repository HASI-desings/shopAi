// Display config only. Authoritative limits live in the `plans` table (see migration). Prices are placeholders until payments are configured.
export const PLANS = [
  { id: "free", name: "Free", price: "$0", requests: "500 units / month", rate: "20 requests / min", points: ["1 project, 3 API keys", "All deterministic analytics", "AI insights (5 units each)"] },
  { id: "developer", name: "Developer", price: "Set at launch", requests: "10,000 units / month", rate: "60 requests / min", points: ["10 projects, 20 API keys", "Usage analytics", "AI insights and questions"] },
  { id: "business", name: "Business", price: "Set at launch", requests: "100,000 units / month", rate: "300 requests / min", points: ["50 projects, 100 API keys", "Priority support option", "Higher limits on request"] },
];
export const ENDPOINT_LIST = [
  ["profit", "Revenue, COGS, gross and operating profit.", "analytics:read", "1 unit"],
  ["margins", "Gross margin, markup and operating margin per product.", "analytics:read", "1 unit"],
  ["products", "Revenue and profit ranked by product.", "analytics:read", "1 unit"],
  ["inventory", "Sales velocity, days of stock left, reorder flags.", "analytics:read", "1 unit"],
  ["sales-trends", "Daily net revenue and period change.", "analytics:read", "1 unit"],
  ["business-insights", "Claude-written findings and recommendations on verified numbers.", "analytics:ai", "5 units"],
  ["ask", "Ask a plain-language question about your data.", "analytics:ai", "5 units"],
];
// Authoritative server-side limits (edit here to change plans).
export const LIMITS: Record<string, { name: string; request_limit: number; rate_limit: number; max_projects: number; max_keys: number }> = {
  free: { name: "Free", request_limit: 500, rate_limit: 20, max_projects: 1, max_keys: 3 },
  developer: { name: "Developer", request_limit: 10000, rate_limit: 60, max_projects: 10, max_keys: 20 },
  business: { name: "Business", request_limit: 100000, rate_limit: 300, max_projects: 50, max_keys: 100 },
};
