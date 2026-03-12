import { useEffect, useRef } from "react"
import { Terminal } from "xterm"
import { io } from "socket.io-client"
import "xterm/css/xterm.css"

export default function TerminalApp() {

  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: "#000000",
        foreground: "#ffffff"
      }
    })

    term.open(terminalRef.current!)

    term.write("Connecting to Codespaces terminal...\r\n")

    const socket = io("https://organic-space-bassoon-9100.app.github.dev")

    socket.on("connect", () => {
      term.write("Connected to Codespaces shell\r\n")
    })

    socket.on("output", (data: string) => {
      term.write(data)
    })

    socket.on("disconnect", () => {
      term.write("\r\nDisconnected from server\r\n")
    })

    term.onData((data) => {
      socket.emit("input", data)
    })

    return () => {
      socket.disconnect()
      term.dispose()
    }

  }, [])

  return (
    <div
      ref={terminalRef}
      style={{
        width: "100%",
        height: "100%",
        background: "black"
      }}
    />
  )
}