import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { ink: "#060A13", navy: "#0A1322", panel: "#0E1A2E", line: "#1B2A45", mist: "#8FA0BC", paper: "#E9EFF9", tide: "#3EE0C1", tideDeep: "#12806C", amber: "#F2B544", loss: "#FF6B6B" },
    fontFamily: { display: ["var(--f-display)"], sans: ["var(--f-body)"], mono: ["var(--f-mono)"] },
  } },
} satisfies Config;
