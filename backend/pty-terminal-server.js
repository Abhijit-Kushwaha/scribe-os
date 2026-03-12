import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import pty from "node-pty"

const app = express()
const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*"
  }
})

io.on("connection", (socket) => {

  console.log("Terminal connected")

  const shell = "bash"

  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  })

  ptyProcess.onData((data) => {
    socket.emit("output", data)
  })

  socket.on("input", (data) => {
    ptyProcess.write(data)
  })

  socket.on("disconnect", () => {
    console.log("Terminal disconnected")
    ptyProcess.kill()
  })

})

server.listen(9100, () => {
  console.log("Interactive terminal running on port 9100")
})
