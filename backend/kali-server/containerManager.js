const { execSync } = require("child_process")

function createContainer(sessionId) {

  const containerName = "scribe_" + sessionId

  execSync(
    `docker run -dit \
    --name ${containerName} \
    -v /workspaces/scribe-os/userdata/${sessionId}:/workspace \
    scribe-terminal`
  )

  return containerName
}

function removeContainer(containerName) {

  try {
    execSync(`docker rm -f ${containerName}`)
  } catch (err) {
    console.log("container cleanup failed")
  }

}

module.exports = { createContainer, removeContainer }