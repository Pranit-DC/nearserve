"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GeolocationTestPage() {
  const [status, setStatus] = useState<string>("Not started");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [reverseGeocode, setReverseGeocode] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testBrowserLocation = () => {
    setStatus("Testing browser geolocation...");
    addLog("Checking if geolocation is supported");

    if (!navigator.geolocation) {
      setStatus("❌ Geolocation not supported");
      addLog("ERROR: Geolocation not supported by browser");
      return;
    }

    addLog("✅ Geolocation is supported");
    addLog("Requesting current position...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(coords);
        setStatus("✅ Browser location obtained");
        addLog(`✅ Got coordinates: ${coords.lat}, ${coords.lng}`);
        testReverseGeocode(coords.lat, coords.lng);
      },
      (error) => {
        setStatus(`❌ Error: ${error.message}`);
        addLog(`ERROR: ${error.message} (code: ${error.code})`);
        if (error.code === 1) {
          addLog("User denied location permission");
        } else if (error.code === 2) {
          addLog("Position unavailable");
        } else if (error.code === 3) {
          addLog("Timeout");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const testReverseGeocode = async (lat: number, lng: number) => {
    addLog("Testing reverse geocoding API...");
    try {
      const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      addLog(`API Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`❌ API Error: ${errorText}`);
        setStatus(`❌ Reverse geocode failed: ${response.status}`);
        return;
      }

      const data = await response.json();
      addLog("✅ Reverse geocode successful");
      setReverseGeocode(data.result);
      setStatus("✅ All tests passed!");
    } catch (error: any) {
      addLog(`❌ Network error: ${error.message}`);
      setStatus(`❌ Network error: ${error.message}`);
    }
  };

  const testGoogleMapsAPI = () => {
    addLog("Testing Google Maps API key...");
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      addLog("❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found");
      setStatus("❌ API key not configured");
      return;
    }

    addLog(`✅ API key configured: ${apiKey.substring(0, 10)}...`);
    addLog("Testing if Google Maps loads...");

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.onload = () => {
      addLog("✅ Google Maps script loaded successfully");
      setStatus("✅ Google Maps API working");
    };
    script.onerror = () => {
      addLog("❌ Failed to load Google Maps script");
      addLog("This could be due to:");
      addLog("- Invalid API key");
      addLog("- API not enabled in Google Cloud Console");
      addLog("- Ad blocker blocking Google APIs");
      setStatus("❌ Google Maps script failed to load");
    };
    document.head.appendChild(script);
  };

  const testDirectGeocode = async () => {
    addLog("Testing direct Google Geocoding API...");
    try {
      const response = await fetch("/api/geocode?q=Mumbai, India");
      addLog(`API Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`❌ API Error: ${errorText}`);
        return;
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        addLog(`✅ Geocoding successful: ${data.results[0].displayName}`);
      } else {
        addLog("⚠️ No results returned");
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Geolocation & Google Maps Debug</h1>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>
          
          <div className="space-y-3">
            <Button onClick={testBrowserLocation} className="w-full">
              1. Test Browser Location
            </Button>
            
            <Button onClick={testGoogleMapsAPI} variant="outline" className="w-full">
              2. Test Google Maps API
            </Button>

            <Button onClick={testDirectGeocode} variant="outline" className="w-full">
              3. Test Geocoding API
            </Button>
          </div>

          {coords && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded">
              <p className="font-semibold">Coordinates:</p>
              <p>Lat: {coords.lat}</p>
              <p>Lng: {coords.lng}</p>
            </div>
          )}

          {reverseGeocode && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="font-semibold">Reverse Geocode Result:</p>
              <p>{reverseGeocode.displayName}</p>
              <pre className="text-xs mt-2 overflow-auto">
                {JSON.stringify(reverseGeocode, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-auto">
            {logs.length === 0 ? (
              <p>No logs yet. Click a test button above.</p>
            ) : (
              logs.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        </Card>

        <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20">
          <h2 className="text-lg font-semibold mb-2">Common Issues</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Ad Blocker:</strong> Disable extensions like uBlock Origin, Privacy Badger for localhost</li>
            <li><strong>Browser Permissions:</strong> Allow location access when prompted</li>
            <li><strong>Google Cloud Console:</strong> Enable "Maps JavaScript API" and "Geocoding API"</li>
            <li><strong>API Key:</strong> Verify NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env</li>
            <li><strong>HTTPS:</strong> Location works on HTTPS or localhost only</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
