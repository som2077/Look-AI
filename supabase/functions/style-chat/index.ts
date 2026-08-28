import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { getWardrobeContext } from "./wardrobe.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the JWT token from the Authorization header (Bearer token)
    const token = authHeader.replace('Bearer ', '')

    // Parse the incoming OpenAI-format request
    const requestData = await req.json()
    const { model, messages, stream, tools } = requestData

    // Fetch wardrobe context
    const wardrobeContext = await getWardrobeContext(token)

    // Inject wardrobe context into the system prompt
    if (messages && messages.length > 0) {
      if (messages[0].role === 'system') {
        messages[0].content += `\n\n## User Wardrobe Context:\n${wardrobeContext}`
      } else {
        messages.unshift({
          role: 'system',
          content: `You are StyleAI — an AI fashion assistant. \n\n## User Wardrobe Context:\n${wardrobeContext}`
        })
      }
    }

    // Forward the modified request to OpenAI
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages,
        stream,
        tools,
      }),
    })

    if (!openAiResponse.ok) {
      const errorData = await openAiResponse.text()
      console.error('OpenAI API Error:', errorData)
      return new Response(errorData, {
        status: openAiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If streaming, return the stream directly
    if (stream) {
      return new Response(openAiResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Otherwise return the JSON response
    const jsonResponse = await openAiResponse.json()
    return new Response(JSON.stringify(jsonResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
