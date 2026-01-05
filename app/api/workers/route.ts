import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";
import { distanceKm } from "@/lib/location";
import { serializeFirestoreData } from "@/lib/firestore-serialization";

type SearchParams = {
  q?: string | null;
  category?: string | null;
  limit?: string | null;
  sort?: string | null;
  lat?: string | null;
  lng?: string | null;
};

function flattenStringArray(values: string[] | null | undefined): string[] {
  if (!values) return [];
  const out: string[] = [];
  for (const raw of values) {
    if (!raw) continue;
    const trimmed = raw.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          for (const p of parsed) {
            if (typeof p === "string" && p.trim())
              out.push(p.toLowerCase().trim());
          }
          continue;
        }
      } catch {
        // fall through to push trimmed below
      }
    }
    out.push(trimmed.toLowerCase());
  }
  return Array.from(new Set(out));
}

interface WorkerForSearch {
  name?: string | null;
  workerProfile?: {
    skilledIn?: string[] | null;
    availableAreas?: string[] | null;
    qualification?: string | null;
    city?: string | null;
    bio?: string | null;
  } | null;
}

function matchesKeyword(q: string, worker: WorkerForSearch): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const skills = flattenStringArray(worker.workerProfile?.skilledIn);
  const areas = flattenStringArray(worker.workerProfile?.availableAreas);
  return (
    (worker.name ?? "").toLowerCase().includes(needle) ||
    (worker.workerProfile?.qualification ?? "")
      .toLowerCase()
      .includes(needle) ||
    (worker.workerProfile?.city ?? "").toLowerCase().includes(needle) ||
    (worker.workerProfile?.bio ?? "").toLowerCase().includes(needle) ||
    skills.some((s) => s.includes(needle)) ||
    areas.some((a) => a.includes(needle))
  );
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sp: SearchParams = {
      q: url.searchParams.get("q"),
      category: url.searchParams.get("category"),
      limit: url.searchParams.get("limit"),
      sort: url.searchParams.get("sort"),
      lat: url.searchParams.get("lat"),
      lng: url.searchParams.get("lng"),
    };

    const q = sp.q?.toLowerCase().trim() ?? "";
    const category = sp.category?.toLowerCase().trim() ?? "";
    const limit = Math.min(
      Math.max(parseInt(sp.limit || "50", 10) || 50, 1),
      200
    );
    const sort = (sp.sort || "relevance").toLowerCase();
    const lat = sp.lat ? parseFloat(sp.lat) : undefined;
    const lng = sp.lng ? parseFloat(sp.lng) : undefined;

    // Fetch all workers with role = WORKER
    const usersRef = adminDb.collection(COLLECTIONS.USERS);
    const workersQuery = await usersRef.where('role', '==', 'WORKER').limit(200).get();
    
    if (workersQuery.empty) {
      return NextResponse.json({ count: 0, workers: [] });
    }

    // Fetch worker profiles for all workers
    const workerProfilesRef = adminDb.collection(COLLECTIONS.WORKER_PROFILES);
    const userIds = workersQuery.docs.map(doc => doc.id);
    
    // Firestore doesn't support 'in' queries with more than 10 items, so we batch
    const workerProfilesMap = new Map();
    for (let i = 0; i < userIds.length; i += 10) {
      const batch = userIds.slice(i, i + 10);
      const profilesQuery = await workerProfilesRef.where('userId', 'in', batch).get();
      profilesQuery.docs.forEach(doc => {
        workerProfilesMap.set(doc.data().userId, { id: doc.id, ...doc.data() });
      });
    }

    // Build workers array with profiles
    const workersRaw = workersQuery.docs.map(doc => {
      const userData = doc.data();
      const workerProfile = workerProfilesMap.get(doc.id) || null;
      return {
        id: doc.id,
        name: userData.name || null,
        role: userData.role,
        workerProfile,
      };
    });

    // Compute distances where possible (JS fallback). This lets the frontend show distances
    // even before DB-side Haversine ordering is used.
    const withDistances = workersRaw.map((w) => {
      const wp = w.workerProfile || {};
      const latVal = wp.latitude;
      const lngVal = wp.longitude;
      let d: number | null = null;
      if (
        typeof lat === "number" &&
        typeof lng === "number" &&
        typeof latVal === "number" &&
        typeof lngVal === "number"
      ) {
        try {
          d = distanceKm({ lat, lng }, { lat: latVal, lng: lngVal });
        } catch {
          d = null;
        }
      }
      return { ...w, distanceKm: d };
    });

    // Apply category/keyword filters
    const filtered = withDistances.filter((w) => {
      const categoryOk = category
        ? flattenStringArray(w.workerProfile?.skilledIn).includes(category)
        : true;
      const keywordOk = matchesKeyword(q, w);
      return categoryOk && keywordOk;
    });

    // If requested sort=nearest and distances were computed, sort by distance (nulls last)
    let result = filtered;
    if (
      sort === "nearest" &&
      typeof lat === "number" &&
      typeof lng === "number"
    ) {
      result = filtered.sort((a, b) => {
        const da =
          a.distanceKm == null ? Number.POSITIVE_INFINITY : a.distanceKm;
        const db =
          b.distanceKm == null ? Number.POSITIVE_INFINITY : b.distanceKm;
        return da - db;
      });
    }

    result = result.slice(0, limit);
    return NextResponse.json({ count: result.length, workers: serializeFirestoreData(result) });
  } catch (err) {
    console.error("/api/workers error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
