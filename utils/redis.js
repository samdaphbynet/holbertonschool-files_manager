const redis = require('redis');

class RedisClient {
    constructor() {
        this.client = redis.createClient();

        // Display any errors in the console
        this.client.on('error', (err) => {
            console.error('Redis Error:', err);
        });
    }

    isAlive() {
        if (this.client) {
            return  true;
        }else {
            return this.client.connected
        }
    }

    async get(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    async set(key, value, durationInSeconds) {
        return new Promise((resolve, reject) => {
            this.client.setex(key, durationInSeconds, value, (err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    async del(key) {
        return new Promise((resolve, reject) => {
            this.client.del(key, (err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(reply);
                }
            });
        });
    }
}

// Creating and exporting an instance of RedisClient
const redisClient = new RedisClient();
module.exports = redisClient;
