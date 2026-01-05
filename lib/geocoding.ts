import { GeocodeResult } from "./location";

// Google Maps Geocoding API client with in-memory caching

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const GEOCODING_BASE = "https://maps.googleapis.com/maps/api/geocode/json";

// simple in-memory cache
type CacheEntry<T> = { t: number; v: T };
const SEARCH_CACHE = new Map<string, CacheEntry<GeocodeResult[]>>();
const REVERSE_CACHE = new Map<string, CacheEntry<GeocodeResult>>();
const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ITEMS = 100;

function getCache<T>(
  map: Map<string, CacheEntry<T>>,
  key: string
): T | undefined {
  const now = Date.now();
  const hit = map.get(key);
  if (hit && now - hit.t < TTL_MS) return hit.v;
  if (hit) map.delete(key);
  return undefined;
}

function setCache<T>(map: Map<string, CacheEntry<T>>, key: string, v: T) {
  if (map.size >= MAX_ITEMS) {
    // naive eviction: delete oldest
    let oldestKey: string | null = null;
    let oldestT = Infinity;
    for (const [k, e] of map.entries()) {
      if (e.t < oldestT) {
        oldestT = e.t;
        oldestKey = k;
      }
    }
    if (oldestKey) map.delete(oldestKey);
  }
  map.set(key, { t: Date.now(), v });
}

export async function geocodeFreeOSM(
  query: string,
  signal?: AbortSignal
): Promise<GeocodeResult[]> {
  if (!query?.trim()) return [];
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("GOOGLE_MAPS_API_KEY is not configured in environment variables");
    throw new Error("Geocoding service is not configured. Please add GOOGLE_MAPS_API_KEY to your environment.");
  }

  const q = query.trim();
  const cached = getCache(SEARCH_CACHE, q);
  if (cached) {
    console.log("Returning cached geocode results for:", q);
    return cached;
  }

  console.log("Geocoding query:", q);
  const url = new URL(GEOCODING_BASE);
  url.searchParams.set("address", query);
  url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });

    if (!res.ok) {
      console.error(`Google Maps API HTTP error: ${res.status}`);
      throw new Error(`Google Maps API error: ${res.status}`);
    }

    const data = (await res.json()) as GoogleGeocodingResponse;
    console.log("Google Maps API response status:", data.status);
    
    if (data.status === "REQUEST_DENIED") {
      console.error("Google Maps API request denied. Check your API key and enabled APIs.");
      throw new Error("Google Maps API request denied. Please verify your API key has Geocoding API enabled.");
    }

    if (data.status === "OVER_QUERY_LIMIT") {
      console.error("Google Maps API quota exceeded");
      throw new Error("Geocoding quota exceeded. Please try again later.");
    }

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Maps API error:", data.status);
      throw new Error(`Google Maps API error: ${data.status}`);
    }

    const results = (data.results || []).slice(0, 5).map(toGeocodeResultFromGoogle);
    console.log(`Found ${results.length} geocode results`);
    setCache(SEARCH_CACHE, q, results);
    return results;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Geocoding error:", error.message);
      throw error;
    }
    throw new Error("Failed to geocode address");
  }
}

export async function reverseGeocodeFreeOSM(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<GeocodeResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("GOOGLE_MAPS_API_KEY is not configured");
    throw new Error("Geocoding service is not configured");
  }

  const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  const cached = getCache(REVERSE_CACHE, key);
  if (cached) {
    console.log("Returning cached reverse geocode for:", key);
    return cached;
  }

  console.log("Reverse geocoding:", lat, lon);
  const url = new URL(GEOCODING_BASE);
  url.searchParams.set("latlng", `${lat},${lon}`);
  url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });

    if (!res.ok) {
      console.error(`Reverse geocode HTTP error: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as GoogleGeocodingResponse;
    console.log("Reverse geocode status:", data.status);
    
    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.warn("No reverse geocode results found");
      return null;
    }

    const result = toGeocodeResultFromGoogle(data.results[0]);
    console.log("Reverse geocode result:", result.displayName);
    setCache(REVERSE_CACHE, key, result);
    return result;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

interface GoogleGeocodingResponse {
  status: string;
  results?: GoogleGeocodingResult[];
}

interface GoogleGeocodingResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

function toGeocodeResultFromGoogle(d: GoogleGeocodingResult): GeocodeResult {
  const components = d.address_components || [];
  
  const getComponent = (...types: string[]): string | undefined => {
    for (const type of types) {
      const comp = components.find((c) => c.types.includes(type));
      if (comp) return comp.long_name;
    }
    return undefined;
  };

  const streetNumber = getComponent("street_number");
  const route = getComponent("route");
  const line1 = [streetNumber, route].filter(Boolean).join(" ") || undefined;

  return {
    coords: {
      lat: d.geometry.location.lat,
      lng: d.geometry.location.lng,
    },
    displayName: d.formatted_address,
    address: {
      line1,
      city: getComponent("locality", "sublocality", "administrative_area_level_3"),
      state: getComponent("administrative_area_level_1"),
      postalCode: getComponent("postal_code"),
      country: getComponent("country"),
      countryCode: components.find((c) => c.types.includes("country"))?.short_name,
    },
    source: "google",
  };
}
