import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";

const BACKEND_WS = "wss://scribe-os-production.up.railway.app";

export default function TerminalApp() {

  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const commandBufferRef = useRef("");

  useEffect(() => {

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: "#000000",
        foreground: "#00ff9c"
      }
    });

    const fitAddon = new FitAddon();

    term.loadAddon(fitAddon);

    termRef.current = term;
    fitRef.current = fitAddon;

    if (containerRef.current) {
      term.open(containerRef.current);
      fitAddon.fit();
    }

    term.writeln("Scribe OS Terminal");
    term.writeln("Connecting to backend...\n");

    const socket = new WebSocket(BACKEND_WS);
    socketRef.current = socket;

    socket.onopen = () => {
      term.writeln("[Connected to backend]\n");
      writePrompt();
    };

    socket.onmessage = (event) => {
      if (event.data === "__CLEAR__") {
        term.clear();
      } else {
        term.writeln(event.data);
      }
      writePrompt();
    };

    socket.onerror = () => {
      term.writeln("[Backend connection error]");
    };

    socket.onclose = () => {
      term.writeln("[Connection closed]");
    };

    term.onData((data) => {

      if (data === "\r") {

        const command = commandBufferRef.current.trim();

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(command);
        }

        commandBufferRef.current = "";

      } 
      
      else if (data === "\u007F") {

        if (commandBufferRef.current.length > 0) {
          commandBufferRef.current = commandBufferRef.current.slice(0, -1);
          term.write("\b \b");
        }

      } 
      
      else {

        commandBufferRef.current += data;
        term.write(data);

      }

    });

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener("resize", handleResize);

    return () => {

      window.removeEventListener("resize", handleResize);

      socket.close();

      term.dispose();

    };

  }, []);

  const writePrompt = () => {

    const term = termRef.current;

    if (!term) return;

    term.write("\r\n\x1b[1;32mscribe\x1b[0m@\x1b[1;34mos\x1b[0m$ ");

  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "black"
      }}
    />
  );

}