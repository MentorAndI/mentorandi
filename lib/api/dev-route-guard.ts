import { NextResponse } from "next/server";

export function createProductionDevRouteResponse() {
  return NextResponse.json(
    { error: "This development endpoint is disabled in production." },
    { status: 404 },
  );
}

export function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}
