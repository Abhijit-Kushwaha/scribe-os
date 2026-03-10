const express = require("express")
const http = require("http")
const WebSocket = require("ws")
const cors = require("cors")

const app = express()
app.use(cors())

const server = http.createServer(app)

const wss = new WebSocket.Server({ server })

// Simple command handler
function runCommand(command){

  command = command.trim()

  if(command === "help"){
    return `
Available commands:
help
whoami
clear
date
about
`
  }

  if(command === "whoami"){
    return "kali@scribe-os"
  }

  if(command === "date"){
    return new Date().toString()
  }

  if(command === "about"){
    return "Scribe OS Kali Terminal Backend"
  }

  if(command === "clear"){
    return "__CLEAR__"
  }

  return `${command}: command not found`
}


// WebSocket terminal connection
wss.on("connection",(ws)=>{

  ws.send("Connected to Scribe OS Kali Terminal\nType 'help' to begin\n\n")

  ws.on("message",(msg)=>{

    const command = msg.toString()

    const output = runCommand(command)

    ws.send(output + "\n")

  })

})


// simple health route
app.get("/",(req,res)=>{
  res.send("Scribe OS Kali Terminal Server Running")
})


// start server
const PORT = process.env.PORT || 3000

server.listen(PORT,()=>{
  console.log("Server running on port " + PORT)
})