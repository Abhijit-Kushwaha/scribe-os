const pty = require("node-pty-prebuilt-multiarch")

function createTerminal(containerName) {

  const term = pty.spawn(
    "docker",
    ["exec", "-it", containerName, "bash"],
    {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: process.env
    }
  )

  return term

}

module.exports = { createTerminal }