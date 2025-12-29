import { NextResponse } from "next/server";
import { geocodeFreeOSM } from "@/lib/geocoding";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }
  try {
    console.log("[API /geocode] Query:", q);
    const results = await geocodeFreeOSM(q);
    console.log("[API /geocode] Success, found", results.length, "results");
    return NextResponse.json({ results });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "geocode failed";
    console.error("[API /geocode] Error:", errorMessage);
    return NextResponse.json(
      { error: errorMessage, results: [] },
      { status: 500 }
    );
  }
}
