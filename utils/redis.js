const redis = require('redis');
const {promisify} = require("util")

class RedisClient {
    constructor() {
        this.client = redis.createClient();

        this.getAsync = promisify(this.client.get).bind(this.client);

        // Display any errors in the console
        this.client.on('error', (err) => {
            console.error('Redis Error:', err);
        });
    }

    isAlive() {
        return this.client.connected
    }

    async get(key) {
        return this.getAsync(key)
    }

    async set(key, value, duration) {
        this.client.setex(key, duration, value);
    }


    async del(key) {
        this.client.del(key);
    }
}

// Creating and exporting an instance of RedisClient
const redisClient = new RedisClient();
module.exports = redisClient;
