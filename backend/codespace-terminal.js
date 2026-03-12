import express from "express"
import cors from "cors"
import { exec } from "child_process"

const app = express()

app.use(cors())
app.use(express.json())

app.post("/run", (req, res) => {

    const cmd = req.body.command

    exec(cmd, { shell: "/bin/bash" }, (err, stdout, stderr) => {

        if (err) {
            res.json({ output: stderr })
            return
        }

        res.json({ output: stdout })

    })

})

app.listen(9000, () => {
    console.log("Codespaces command server running on port 9000")
})