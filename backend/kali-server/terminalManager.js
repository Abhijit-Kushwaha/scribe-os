const pty = require("node-pty")

function createTerminal() {

  const shell = process.platform === "win32"
    ? "powershell.exe"
    : "bash"

  const term = pty.spawn(shell, [], {

    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env

  })

  return term
}

module.exports = { createTerminal }