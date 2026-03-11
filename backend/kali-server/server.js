const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const HOST = "0.0.0.0";
const PORT = Number.parseInt(process.env.PORT || "8000", 10);

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

// Railway health check + public root response
app.get("/", (_req, res) => {
  res.status(200).type("text/plain").send("Scribe OS Terminal Backend Running");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

function runCommand(command) {
  const cmd = String(command || "").trim().toLowerCase();

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

  if (!cmd) {
    return "";
  }

  return `${cmd}: command not found`;
}

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Terminal connected");

  if (ws.readyState === WebSocket.OPEN) {
    ws.send("Connected to Scribe OS Terminal\nType 'help'\n");
  }

  ws.on("message", (msg) => {
    try {
      const command = msg.toString();
      const output = runCommand(command);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`${output}\n`);
      }
    } catch (error) {
      console.error("Message handling error:", error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("Error processing command\n");
      }
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket client error:", error);
  });

  ws.on("close", () => {
    console.log("Terminal disconnected");
  });
});

wss.on("error", (error) => {
  console.error("WebSocket server error:", error);
});

server.on("error", (error) => {
  console.error("HTTP server error:", error);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});

const shutdown = () => {
  console.log("Shutting down server...");
  wss.close(() => {
    server.close(() => process.exit(0));
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
