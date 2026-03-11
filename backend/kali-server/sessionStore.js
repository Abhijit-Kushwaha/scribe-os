const sessions = {}

function createSession(id, terminal) {
  sessions[id] = terminal
}

function getSession(id) {
  return sessions[id]
}

function removeSession(id) {
  delete sessions[id]
}

module.exports = {
  createSession,
  getSession,
  removeSession
}