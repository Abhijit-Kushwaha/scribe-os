import { serve } from "serve";

const RESEND_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {

  try {

    const { to, subject, html } = await req.json()

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "ScribeOS <noreply@yourdomain.com>",
          to: [to],
          subject: subject,
          html: html
        })
      }
    )

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }

})