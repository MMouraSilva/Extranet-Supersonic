require('dotenv').config();

const redisUrl = process.env.REDIS_URL;
const redisUsername = process.env.REDIS_USERNAME;
const redisPassword = process.env.REDIS_PASSWORD;
const redisPort = process.env.REDIS_PORT;

const { createClient } = require("redis");
const client = createClient({
    username: redisUsername,
    password: redisPassword,
    socket: {
        host: redisUrl,
        port: redisPort,
    }
});

const starup = async () => {
    await client
        .on("error", err => console.log("Redis Client Error", err))
        .connect();
}

starup();

module.exports = client;