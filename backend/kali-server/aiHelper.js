const axios = require("axios")

async function suggestCommand(input) {

  try {

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You suggest linux terminal commands."
          },
          {
            role: "user",
            content: input
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    )

    return response.data.choices[0].message.content

  } catch (err) {

    return "AI suggestion unavailable"

  }

}

module.exports = { suggestCommand }