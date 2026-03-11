import { useEffect, useRef } from "react"
import { Terminal } from "xterm"
import "xterm/css/xterm.css"

export default function TerminalApp() {

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: "#000000"
      }
    })

    term.open(ref.current!)

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
      style={{
        width: "100%",
        height: "100%",
        background: "black"
      }}
      ref={ref}
    />
  )
}