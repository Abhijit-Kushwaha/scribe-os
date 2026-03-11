const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/*
Root route
Railway will call this to check if the server is alive
*/
app.get("/", (req, res) => {
  res.status(200).send("Scribe OS Terminal Backend Running");
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

/*
Simple command engine
You can expand this later with real tools
*/
function runCommand(command) {
  const cmd = command.trim().toLowerCase();

  if (cmd === "help") {
    return `
Available Commands:

help      → list commands
whoami    → show current user
date      → show system date
about     → info about terminal
clear     → clear terminal
`;
  }

  if (cmd === "whoami") {
    return "kali@scribe-os";
  }

  if (cmd === "date") {
    return new Date().toString();
  }

  if (cmd === "about") {
    return "Scribe OS Kali Terminal Backend";
  }

  if (cmd === "clear") {
    return "__CLEAR__";
  }

  return `${cmd}: command not found`;
}

/*
WebSocket connection
This powers the browser terminal
*/
wss.on("connection", (ws) => {
  console.log("Terminal connected");

  ws.send("Connected to Scribe OS Terminal\nType 'help'\n");

  ws.on("message", (msg) => {
    try {
      const command = msg.toString();
      const output = runCommand(command);
      ws.send(output + "\n");
    } catch (err) {
      ws.send("Error processing command\n");
    }
  });

  ws.on("close", () => {
    console.log("Terminal disconnected");
  });
});

/*
Railway requires using its assigned port
*/
const PORT = process.env.PORT || 8000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});