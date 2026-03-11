const express = require("express")
const cors = require("cors")
const WebSocket = require("ws")
const { createTerminal } = require("./terminalManager")

const app = express()

app.use(cors())
app.get("/", (req, res) => {
  res.send("Scribe OS Terminal Backend Running")
})

const server = app.listen(8000, () => {
  console.log("Terminal server running on port 8000")
})

const wss = new WebSocket.Server({ server })

wss.on("connection", (ws) => {

  const terminal = createTerminal()

  terminal.onData((data) => {
    ws.send(data)
  })

  ws.on("message", (msg) => {
    terminal.write(msg)
  })

  ws.on("close", () => {
    terminal.kill()
  })

})