const redis = require('redis');
const loadEnv = require("../loadenv")

let client;
//checks if redis connection is establised or not, connect if not connected
const getRedisClient = async () => {
    if (!client) {
        client = redis.createClient({
            url: loadEnv.REDIS_URL
        });

        client.on("error", (err) => console.error("Redis Client Error", err));

        await client.connect();
    }

    return client;
};

module.exports = getRedisClient;