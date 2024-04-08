import { v4 as uuidv4 } from "uuid"
import RedisClient from "../utils/redis"
import dbClient from "../utils/db"
import sha1 from "sha1"

class AuthController {
    static async getConnect(request, response) {
        const authorization = request.header('Authorization') || null;
        if (!authorization) return response.status(401).send({ error: 'Unauthorized' });
    
        const buff = Buffer.from(authorization.replace('Basic ', ''), 'base64');
        const credentials = {
          email: buff.toString('utf-8').split(':')[0],
          password: buff.toString('utf-8').split(':')[1],
        };
    
        if (!credentials.email || !credentials.password) return response.status(401).send({ error: 'Unauthorized' });
    
        credentials.password = sha1(credentials.password);
    
        const userExists = await dbClient.db.collection('users').findOne(credentials);
        if (!userExists) return response.status(401).send({ error: 'Unauthorized' });
    
        const token = uuidv4();
        const key = `auth_${token}`;
        await RedisClient.set(key, userExists._id.toString(), 86400);
    
        return response.status(200).send({ token });
      }

    static async getDisconnect(req, res) {
        const token = req.headers['x-token']

        const key = `auth_${token}`

        const userId = await RedisClient.get(key)

        if (!userId) {
            return res.status(401).send({error: "Unauthorized"})
        }

        await RedisClient.client.del(key)
        return res.status(200).end()
    }
}

export {AuthController};