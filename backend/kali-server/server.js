const express = require("express")
const cors = require("cors")
const http = require("http")
const WebSocket = require("ws")

const { createTerminal } = require("./terminalManager")

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 8000

app.get("/", (req, res) => {
  res.json({
    status: "Scribe OS Terminal Running",
    shell: "real linux shell"
  })
})

const server = http.createServer(app)

const wss = new WebSocket.Server({ server })

wss.on("connection", (ws) => {

  const term = createTerminal()

  term.onData((data) => {
    ws.send(data)
  })

  ws.on("message", (msg) => {
    term.write(msg.toString())
  })

  ws.on("close", () => {
    term.kill()
  })

})

server.listen(PORT, () => {
  console.log("Terminal backend running on", PORT)
})