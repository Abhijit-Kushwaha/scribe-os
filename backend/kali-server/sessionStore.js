const sessions = {}

function createSession(id, container, terminal) {

  sessions[id] = {
    container,
    terminal
  }

}

function getSession(id) {
  return sessions[id]
}

function deleteSession(id) {
  delete sessions[id]
}

module.exports = {
  createSession,
  getSession,
  deleteSession
}