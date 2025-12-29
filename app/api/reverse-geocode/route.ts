import { NextResponse } from "next/server";
import { reverseGeocodeFreeOSM } from "@/lib/geocoding";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.error("[API /reverse-geocode] Invalid coordinates:", { lat, lng });
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }
  try {
    console.log("[API /reverse-geocode] Coordinates:", lat, lng);
    const result = await reverseGeocodeFreeOSM(lat, lng);
    if (result) {
      console.log("[API /reverse-geocode] Success:", result.displayName);
    } else {
      console.log("[API /reverse-geocode] No results found");
    }
    return NextResponse.json({ result });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "reverse geocode failed";
    console.error("[API /reverse-geocode] Error:", errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
