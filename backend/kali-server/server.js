const express = require("express")
const http = require("http")
const WebSocket = require("ws")
const cors = require("cors")

const app = express()
app.use(cors())

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

function runCommand(cmd) {

  cmd = cmd.trim()

  if (cmd === "help") return "Commands: help, whoami, date, about"
  if (cmd === "whoami") return "kali@scribe-os"
  if (cmd === "date") return new Date().toString()
  if (cmd === "about") return "Scribe OS Terminal Backend"

  return `${cmd}: command not found`
}

wss.on("connection", (ws) => {

  ws.send("Connected to Scribe OS Terminal\nType 'help'\n")

  ws.on("message", (msg) => {
    const output = runCommand(msg.toString())
    ws.send(output + "\n")
  })

})

app.get("/", (req, res) => {
  res.send("Scribe OS Terminal Backend Running")
})

const PORT = process.env.PORT || 8000

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`)
})