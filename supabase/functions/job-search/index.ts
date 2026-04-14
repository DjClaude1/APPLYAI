// supabase/functions/job-search/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/genai@0.1.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, location, filters } = await req.json()
    
    // Initialize Supabase Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check Cache First
    const { data: cached } = await supabase
      .from('jobs_cache')
      .select('results')
      .eq('query', query)
      .eq('location', location || '')
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24h cache
      .maybeSingle()

    if (cached) {
      return new Response(
        JSON.stringify({ jobs: cached.results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // If not cached, use Gemini with Search to find real jobs
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const filterText = filters ? `
    Filters:
    - Job Type: ${filters.jobType || 'Any'}
    - Salary Range: ${filters.salaryRange || 'Any'}
    - Remote Only: ${filters.remoteOnly ? 'Yes' : 'No'}
    - Industry: ${filters.industry || 'Any'}
    - Seniority: ${filters.seniority || 'Any'}
    ` : '';

    const prompt = `Find 10 real, current job openings for "${query}" in "${location || 'Remote'}". 
    ${filterText}
    Include: title, company, location, type, salary, description, postedAt, link, source.
    Return ONLY a JSON array of objects.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Clean JSON from markdown
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim()
    const jobs = JSON.parse(jsonStr)

    // Save to Cache
    await supabase.from('jobs_cache').insert({
      query,
      location: location || '',
      results: jobs
    })

    return new Response(
      JSON.stringify({ jobs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Job Search Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
