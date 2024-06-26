import dbClient from "../utils/db";
import redisClient from "../utils/redis";
import Queue from "bull";
import sha1 from "sha1";

const userQ = new Queue("userQ");

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).send({ error: "Missing email" });
    if (!password) return res.status(400).send({ error: "Missing password" });
    const emailExists = await dbClient.users.findOne({ email });
    if (emailExists) return res.status(400).send({ error: "Already exist" });

    const secPass = sha1(password);

    const insertStat = await dbClient.users.insertOne({
      email,
      password: secPass,
    });

    const createdUser = {
      id: insertStat.insertedId,
      email,
    };

    await userQ.add({
      userId: insertStat.insertedId.toString(),
    });

    return res.status(201).send(createdUser);
  }

  static async getMe(req, res){
    const token = req.headers['x-token']
    const key = `auth_${token}`

    const userId = await redisClient.get(key)

    if (!userId) {
      return res.status(401).send({error: "Unauthorized"})
    }

    const user = await dbClient.users.findOne({ _id: userId });

    if (!user) {
      return res.status(401).send({error: "Unauthorized"})
    }

    return res.json({email: user.email, id: user._id})
  }
}

module.exports = UsersController;
