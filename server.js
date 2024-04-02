const express = require("express")
import indexRoutes from "./routes/index"

const app = express()

const port = 5000

app.use(express.json())


indexRoutes(app)

app.listen(port, function() {
    console.log(`Server running on port ${port}`)
})