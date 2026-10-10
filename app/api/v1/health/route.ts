import { NextResponse } from "next/server";
export const GET = () => NextResponse.json({ success: true, data: { status: "ok", version: "v1" } });
