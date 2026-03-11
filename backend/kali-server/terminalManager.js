const pty = require("node-pty-prebuilt-multiarch")

function createTerminal() {

  const shell = process.platform === "win32"
    ? "powershell.exe"
    : "bash"

  const terminal = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  })

  return terminal
}

module.exports = { createTerminal }