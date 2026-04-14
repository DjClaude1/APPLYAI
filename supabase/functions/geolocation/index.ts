// supabase/functions/geolocation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lat, lng } = await req.json()
    
    // Use OpenStreetMap Nominatim (Free, but be respectful of rate limits)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'Supabase-Edge-Function-ResumeApp'
        }
      }
    )
    
    const data = await response.json()
    const city = data.address.city || data.address.town || data.address.village || ''
    const state = data.address.state || ''
    const location = city && state ? `${city}, ${state}` : (data.display_name || "Unknown Location")

    return new Response(
      JSON.stringify({ location }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Geolocation Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
