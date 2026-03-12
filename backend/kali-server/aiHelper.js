async function suggestCommand(input) {

  if (input.includes("scan network")) {
    return "nmap -sV target-ip"
  }

  if (input.includes("list files")) {
    return "ls -lah"
  }

  return "command not recognized"

}

module.exports = { suggestCommand }