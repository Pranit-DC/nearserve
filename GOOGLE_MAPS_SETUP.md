# Google Maps Integration Setup

## ✅ Implementation Complete

Your project now uses **Google Maps** instead of OpenStreetMap for both:
1. **Geocoding API** - Converting addresses to coordinates
2. **Maps Display** - Showing interactive maps with worker locations

## 🔑 Google Cloud Console Setup

### Required APIs to Enable:
Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) and enable:

1. **Geocoding API** - For address ↔ coordinates conversion
2. **Maps JavaScript API** - For rendering interactive maps
3. **Places API** (optional) - For autocomplete search

### API Key Configuration:
Your API key is already configured in `.env`:
```
GOOGLE_MAPS_API_KEY=AIzaSyDzdbJvbLMccN3mve6SVgwlUhjsvwHETUA
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDzdbJvbLMccN3mve6SVgwlUhjsvwHETUA
```

### Security (Important!):
1. Go to [API Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Under "Application restrictions", select "HTTP referrers"
4. Add: `localhost:3000/*` and your production domain
5. Under "API restrictions", select "Restrict key" and choose the 3 APIs above

## 📦 Changes Made

### Files Modified:
- ✅ `lib/geocoding.ts` - Replaced OSM with Google Geocoding API
- ✅ `components/ui/map-preview.tsx` - Replaced Leaflet with Google Maps
- ✅ `scripts/backfill-worker-latlng.mjs` - Updated geocoding script
- ✅ `.env` - Added Google Maps API keys
- ✅ `package.json` - Added @types/google.maps

### Files Unchanged (Zero UI/UX Impact):
- ✅ All API routes (just call the same functions)
- ✅ `components/ui/openstreetmap-input.tsx` (decoupled)
- ✅ All other components
- ✅ User-facing features remain identical

## 🚀 Next Steps

1. **Restart your dev server** to load new environment variables:
   ```bash
   npm run dev
   ```

2. **Verify the APIs are enabled** in Google Cloud Console

3. **Test the map** - Open any page with worker locations

4. You should now see "Google" branding on the map instead of "Leaflet | OpenStreetMap"

## 💰 Pricing Note

Google Maps has a generous free tier:
- **$200 free credit per month**
- Geocoding: $5 per 1,000 requests (beyond free tier)
- Maps JavaScript API: $7 per 1,000 loads
- Most small/medium apps stay within free tier

## 🔄 Rollback (If Needed)

The old Leaflet package is still installed. To rollback:
```bash
git checkout lib/geocoding.ts components/ui/map-preview.tsx .env
```
