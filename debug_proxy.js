require('dotenv').config();

async function run() {
  const res = await fetch(process.env.EXPO_PUBLIC_SUPABASE_URL + "/functions/v1/openai-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      body: {
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: "Hi" }, { role: "user", content: "Plan an outfit for today" }],
        tools: [
          {
            type: "function",
            function: {
              name: "get_local_weather",
              description: "Get the current weather for a location",
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string", description: "City name" }
                },
                required: ["location"]
              }
            }
          }
        ],
        temperature: 0.5,
        stream: false
      }
    })
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}

run();
