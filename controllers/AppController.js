import redisClient from "../utils/redis"
import db from "../utils/db"

class AppController {
    static getStatus(req, res) {
        const status = {
            redis: redisClient.isAlive(),
            db: db.isAlive()
        }

        res.status(200).send(status)
    }

    static async getStats(req, res) {
        const stats = {
            users: await db.nbUsers(),
            files: await db.nbFiles()
        }
        res.status(200).send(stats)
    }
}

export default AppController