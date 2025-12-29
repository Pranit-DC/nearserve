"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

type Worker = {
  id: string;
  name?: string | null;
  distanceKm?: number | null;
  workerProfile?: {
    latitude?: number | null;
    longitude?: number | null;
    lat?: number | null;
    lng?: number | null;
    name?: string | null;
    category?: string | null;
    jobCategory?: string | null;
    skill?: string | null;
    skills?: string[] | null;
  } | null;
  category?: string | null;
  skill?: string | null;
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  location?: {
    lat?: number | null;
    lng?: number | null;
  } | null;
};

function pickLatLng(w: Worker): { lat: number; lng: number } | null {
  if (!w) return null;
  const candidates = [
    { lat: w.lat, lng: w.lng },
    { lat: w.latitude, lng: w.longitude },
    { lat: w.location?.lat, lng: w.location?.lng },
    { lat: w.workerProfile?.latitude, lng: w.workerProfile?.longitude },
    { lat: w.workerProfile?.lat, lng: w.workerProfile?.lng },
  ];
  for (const c of candidates) {
    if (c && typeof c.lat === "number" && typeof c.lng === "number")
      return { lat: c.lat, lng: c.lng };
  }
  return null;
}

// Load Google Maps script
function useGoogleMapsScript() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check if API key is available
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
      setError("Google Maps API key not configured");
      return;
    }

    if ((window as any).google?.maps) {
      console.log("Google Maps already loaded");
      setLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    const existingScript = document.getElementById(scriptId);
    
    if (existingScript) {
      console.log("Google Maps script tag exists, waiting for load...");
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps) {
          console.log("Google Maps loaded (existing script)");
          setLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!(window as any).google?.maps) {
          setError("Google Maps failed to load (timeout)");
          console.error("Google Maps load timeout");
        }
      }, 10000);
      
      return () => clearInterval(checkInterval);
    }

    console.log("Loading Google Maps script...");
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("Google Maps loaded successfully");
      setLoaded(true);
    };
    script.onerror = (e) => {
      const errorMsg = "Failed to load Google Maps. This might be due to: 1) Invalid API key, 2) Billing not enabled in Google Cloud, or 3) Required APIs not enabled.";
      console.error(errorMsg, e);
      setError(errorMsg);
    };
    
    // Listen for Google Maps API errors
    (window as any).gm_authFailure = () => {
      const errorMsg = "Google Maps authentication failed. Please check your API key and billing settings.";
      console.error(errorMsg);
      setError(errorMsg);
    };
    
    document.head.appendChild(script);
  }, []);

  return { loaded, error };
}

export default function MapPreview({
  workers,
  center,
  zoom = 12,
  height = 360,
}: {
  workers: Worker[];
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  height?: number;
}) {
  const { loaded: mapsLoaded, error: mapsError } = useGoogleMapsScript();
  const mapRef = useRef<google.maps.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const router = useRouter();

  const markers = useMemo(() => {
    const m: {
      lat: number;
      lng: number;
      id: string;
      name?: string | null;
      category?: string | null;
      skill?: string | null;
    }[] = [];
    for (const w of workers || []) {
      const p = pickLatLng(w);
      if (!p) continue;
      const category =
        w.category ??
        w.workerProfile?.category ??
        w.workerProfile?.jobCategory ??
        null;
      let skill: string | null = null;
      if (w.skill) skill = w.skill;
      else if (w.workerProfile?.skill) skill = w.workerProfile.skill;
      else if (
        Array.isArray(w.workerProfile?.skills) &&
        w.workerProfile.skills.length > 0
      ) {
        const s = w.workerProfile.skills[0];
        skill = typeof s === "string" ? s : String(s);
      }
      m.push({
        lat: p.lat,
        lng: p.lng,
        id: w.id,
        name: w.name ?? w.workerProfile?.name ?? "Worker",
        category,
        skill,
      });
      if (m.length >= 200) break;
    }
    return m;
  }, [workers]);

  const centerPoint =
    center ??
    (markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : null);

  const CATEGORY_COLORS: Record<string, string> = {
    plumber: "#ef4444",
    electrician: "#f59e0b",
    carpenter: "#10b981",
    cleaner: "#3b82f6",
    default: "#6366f1",
  };

  useEffect(() => {
    if (!containerRef.current || !centerPoint || !mapsLoaded) return;
    if (typeof window === "undefined" || !(window as any).google?.maps) return;

    // Initialize map
    if (!mapRef.current) {
      try {
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: centerPoint,
          zoom,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: "auto",
        });
        infoWindowRef.current = new google.maps.InfoWindow();
      } catch (error) {
        console.error("Failed to initialize Google Maps:", error);
        return;
      }
    }

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Create markers
    markers.forEach((mk) => {
      if (!mapRef.current) return;

      const color =
        (mk.category && CATEGORY_COLORS[String(mk.category).toLowerCase()]) ??
        CATEGORY_COLORS.default;

      try {
        // Use standard Marker for better compatibility
        const marker = new google.maps.Marker({
          map: mapRef.current,
          position: { lat: mk.lat, lng: mk.lng },
          title: mk.name || "Worker",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 7,
          },
        });

        // Add click listener for info window
        marker.addListener("click", () => {
          if (!infoWindowRef.current || !mapRef.current) return;

          const viewBtnClasses =
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-8 px-3 bg-white border text-neutral-900 hover:bg-gray-50 cursor-pointer";

          const content = `
            <div class="map-popup" style="padding:8px;min-width:170px">
              <div class="map-popup-name" style="font-weight:600;font-size:0.95rem">${escapeHtml(
                mk.name || "Worker"
              )}</div>
              ${
                mk.skill
                  ? `<div class="map-popup-skill" style="font-size:0.9rem;color:#6b7280;margin-top:4px">${escapeHtml(
                      mk.skill
                    )}</div>`
                  : ""
              }
              <div style="margin-top:8px">
                <a href="/workers/${
                  mk.id
                }" class="${viewBtnClasses}" style="text-decoration:none">View Profile</a>
              </div>
            </div>
          `;

          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(mapRef.current, marker);

          // Highlight worker card
          try {
            const card = document.querySelector(`[data-worker-id="${mk.id}"]`);
            if (card) card.classList.add("worker-highlight");
          } catch (err) {}
        });

        markersRef.current.push(marker);
      } catch (error) {
        console.error("Failed to create marker:", error);
      }
    });

    // Set center
    if (mapRef.current && centerPoint) {
      mapRef.current.setCenter(centerPoint);
      mapRef.current.setZoom(zoom);
    }

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [containerRef, markers, centerPoint, zoom, mapsLoaded]);

  if (!centerPoint) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-[360px] overflow-hidden flex items-center justify-center">
          <div className="text-center text-neutral-500 dark:text-neutral-400">
            <div className="text-lg font-medium mb-2">Map placeholder</div>
            <div className="text-sm">
              Set a location or allow browser location to view nearby workers.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
        style={{ height }}
      >
        {mapsError ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center text-red-500">
              <p className="font-semibold mb-2">Map Loading Error</p>
              <p className="text-sm">{mapsError}</p>
              <p className="text-xs mt-2 text-gray-500">
                Please check console for details
              </p>
            </div>
          </div>
        ) : !mapsLoaded ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-neutral-500">Loading map...</div>
          </div>
        ) : (
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        )}
      </div>
      <style>{`
        .map-popup { font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
        .map-popup-name { font-size:0.95rem; }
        .map-popup-skill { color: #6b7280; }
      `}</style>
    </div>
  );
}

function escapeHtml(s: string) {
  return String(s).replace(
    /[&<>"'`]/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "`": "&#96;",
      }[c] as string)
  );
}
