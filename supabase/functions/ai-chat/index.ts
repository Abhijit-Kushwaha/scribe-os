import { serve } from "serve";

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")

serve(async (req) => {
  try {

    const { messages } = await req.json()

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages
        })
      }
    )

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
})