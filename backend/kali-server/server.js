const express = require("express")
const cors = require("cors")
const WebSocket = require("ws")
const pty = require("node-pty")

const app = express()
app.use(cors())

const PORT = process.env.PORT || 8000

const server = app.listen(PORT, () => {
  console.log("Terminal server running on port", PORT)
})

const wss = new WebSocket.Server({ server })

wss.on("connection", (ws) => {

  const terminal = pty.spawn(
    "docker",
    ["exec", "-i", "scribe-kali", "bash"],
    {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: process.env
    }
  )

  terminal.onData(data => {
    if (ws.readyState === 1) {
      ws.send(data)
    }
  })

  ws.on("message", msg => {
    terminal.write(msg.toString())
  })

  ws.on("close", () => {
    terminal.kill()
  })

})