/**
 * Daily Seed API Route
 * Returns the current daily seed for deterministic game generation
 */

import { NextResponse } from "next/server";
import { getDailySeed } from "../../lib/seed";

export async function GET() {
  const seed = getDailySeed();
  const timestamp = Date.now();

  return NextResponse.json({
    seed,
    timestamp,
    utcDate: new Date().toUTCString(),
  });
}
