const express = require("express")
const cors = require("cors")
const http = require("http")
const WebSocket = require("ws")

const { createTerminal } = require("./terminalManager")

const app = express()
app.use(cors())

const PORT = process.env.PORT || 8000

app.get("/", (req, res) => {
  res.json({
    status: "Scribe OS Terminal Backend Running"
  })
})

const server = http.createServer(app)

const wss = new WebSocket.Server({ server })

wss.on("connection", (ws) => {

  const terminal = createTerminal()

  terminal.onData((data) => {
    ws.send(data)
  })

  ws.on("message", (msg) => {
    terminal.write(msg.toString())
  })

  ws.on("close", () => {
    terminal.kill()
  })

})

server.listen(PORT, () => {
  console.log("Terminal backend running on", PORT)
})