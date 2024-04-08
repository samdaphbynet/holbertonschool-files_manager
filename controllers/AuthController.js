import { v4 as uuidv4 } from "uuid"
import redisClient from "../utils/redis"
import dbClient from "../utils/db"

import sha1 from "sha1"

class AuthController {
    static async getConnect(req, res) {
        const credentials = req.headers.authorization.split(' ')[1];
        const [email, password] = Buffer.from(credentials, 'base64').toString().split(':');
    
        const user = await dbClient.users.findOne({ email, password: sha1(password) });
    
        if (!user) {
          return res.status(401).send({ error: 'Unauthorized' });
        }
    
        const token = uuidv4();
        const key = `auth_${token}`;
    
        await redisClient.set(key, user._id.toString(), 'EX', 86400);
    
        return res.status(200).json({ token });
    }

    static async getDisconnect(req, res) {
        const token = req.headers['x-token']

        const key = `auth_${token}`

        const userId = await redisClient.get(key)

        if (!userId) {
            return res.status(401).send({error: "Unauthorized"})
        }

        await redisClient.client.del(key)
        return res.status(200).end()
    }
}

export {AuthController};