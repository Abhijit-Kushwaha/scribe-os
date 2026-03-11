import { useEffect, useRef } from "react"
import { Terminal } from "xterm"
import "xterm/css/xterm.css"

export default function TerminalApp() {

  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {

    const term = new Terminal({
      cursorBlink: true
    })

    term.open(terminalRef.current!)

    const socket = new WebSocket(
      "wss://scribe-os-production.up.railway.app"
    )

    socket.onmessage = (event) => {
      term.write(event.data)
    }

    term.onData((data) => {
      socket.send(data)
    })

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