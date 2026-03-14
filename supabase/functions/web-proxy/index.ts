import { serve } from "serve";

serve(async (req) => {
  try {
    const { url } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400 }
      )
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "ScribeOS Browser"
      }
    })

    const contentType = response.headers.get("content-type") || "text/html"
    const body = await response.text()

    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*"
      }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})