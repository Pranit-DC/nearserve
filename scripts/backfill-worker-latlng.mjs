import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
// Google Maps Geocoding API helper for this script
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || ''
const GEOCODING_BASE = 'https://maps.googleapis.com/maps/api/geocode/json'

async function geocodeFreeOSM(query){
  if(!query?.trim()) return []
  if(!GOOGLE_MAPS_API_KEY) {
    console.error('GOOGLE_MAPS_API_KEY not configured')
    return []
  }
  const url = new URL(GEOCODING_BASE)
  url.searchParams.set('address', query)
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY)
  const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } })
  if(!res.ok) return []
  const data = await res.json()
  if(data.status !== 'OK' || !data.results) return []
  return (data.results || []).slice(0, 3).map(d=>({ 
    lat: d.geometry.location.lat, 
    lon: d.geometry.location.lng, 
    display_name: d.formatted_address 
  }))
}

const prisma = new PrismaClient()

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)) }

async function main(){
  console.log('Starting backfill: find WorkerProfile rows with null lat/lng')
  const LIMIT = parseInt(process.env.BACKFILL_LIMIT || '200', 10)
  const profiles = await prisma.workerProfile.findMany({ where: { OR: [{ latitude: null }, { longitude: null }] }, take: LIMIT })
  console.log(`Found ${profiles.length} profiles to inspect`)
  let updated = 0
  for(const p of profiles){
    try{
      // Prepare candidate address forms to try progressively
      const candidates = []
      const full = [p.address, p.city, p.state, p.country, p.postalCode].filter(Boolean).join(', ')
      if(full) candidates.push({ label: 'full', q: full })
      if(p.postalCode && p.city) candidates.push({ label: 'postal+city', q: [p.postalCode, p.city, p.state, p.country].filter(Boolean).join(', ') })
      if(p.city) candidates.push({ label: 'city', q: [p.city, p.state, p.country].filter(Boolean).join(', ') })
      // try availableAreas as smaller local hints
      if(Array.isArray(p.availableAreas) && p.availableAreas.length){
        for(const area of p.availableAreas.slice(0,3)){
          candidates.push({ label: `area:${area}`, q: [area, p.city, p.state, p.country].filter(Boolean).join(', ') })
        }
      }

      if(candidates.length === 0){
        console.log('\nSkipping (no address data):', p.id)
        continue
      }

      let found = null
      console.log(`\nGeocoding for: ${p.id} (trying ${candidates.length} candidate forms)`)
      for(const c of candidates){
        console.log('  -> trying', c.label, '-', c.q)
        const results = await geocodeFreeOSM(c.q)
        if(results && results.length){
          const best = results[0]
          const lat = best.lat ?? best.coords?.lat ?? null
          const lng = best.lon ?? best.coords?.lng ?? best.coords?.lon ?? null
          if(lat && lng){
            found = { lat: Number(lat), lng: Number(lng), method: c.label }
            console.log('    -> hit:', found.lat, found.lng, `method=${c.label}`)
            break
          }
        }
        console.log('    -> no results for', c.label)
        // be polite between candidate tries as well
        await sleep(1100)
      }

      if(found){
        await prisma.workerProfile.update({ where: { id: p.id }, data: { latitude: found.lat, longitude: found.lng } })
        console.log('Updated', p.id, found.lat, found.lng, 'via', found.method)
        updated++
      } else {
        console.log('No geocode result for', p.id)
      }
    }catch(e){
      console.error('Error for', p.id, e)
    }
    // Small delay between requests
    await sleep(200)
  }
  console.log('\nBackfill complete. Updated', updated, 'profiles')
  await prisma.$disconnect()
}

main().catch(async (e)=>{ console.error(e); await prisma.$disconnect(); process.exit(1) })
