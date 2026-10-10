import { describe, it, expect } from "vitest";
import { computeMetrics } from "@/lib/calc";
const sales = [
  { product_id: "p1", product_name: "Shirt", quantity: 40, unit_price: 1800, unit_cost: 1100, discount: 2000 },
  { product_id: "p2", product_name: "Jeans", quantity: 15, unit_price: 3500, unit_cost: 2200 },
];
describe("computeMetrics", () => {
  const r = computeMetrics(sales, [{ category: "rent", amount: 12000 }, { category: "utilities", amount: 2500 }]);
  it("revenue, cogs, profit", () => {
    expect(r.metrics.gross_revenue).toBe(124500); expect(r.metrics.net_revenue).toBe(122500);
    expect(r.metrics.cost_of_goods_sold).toBe(77000); expect(r.metrics.gross_profit).toBe(45500);
    expect(r.metrics.gross_margin_percent).toBe(37.14); expect(r.metrics.operating_profit_estimate).toBe(31000);
  });
  it("handles returns", () => {
    const x = computeMetrics([{ ...sales[0], returned_quantity: 10, discount: 0 }]);
    expect(x.metrics.net_revenue).toBe(54000); expect(x.metrics.cost_of_goods_sold).toBe(33000);
  });
  it("never invents missing cost", () => {
    const x = computeMetrics([{ product_id: "a", product_name: "A", quantity: 1, unit_price: 10 }]);
    expect(x.metrics.gross_profit).toBeNull(); expect(x.data_quality_warnings.length).toBeGreaterThan(0);
  });
  it("zero revenue gives null margin", () => {
    const x = computeMetrics([{ product_id: "a", product_name: "A", quantity: 1, unit_price: 0, unit_cost: 0 }]);
    expect(x.metrics.gross_margin_percent).toBeNull();
  });
  it("is decimal safe", () => {
    const x = computeMetrics([{ product_id: "a", product_name: "A", quantity: 3, unit_price: 0.1, unit_cost: 0.07 }]);
    expect(x.metrics.net_revenue).toBe(0.3); expect(x.metrics.gross_profit).toBe(0.09);
  });
});
