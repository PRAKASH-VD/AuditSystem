const IORedis = require('ioredis');
const { env } = require('./env');

let connection;

if (env.REDIS_URL) {
  connection = new IORedis(env.REDIS_URL);
} else {
  connection = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined
  };
}

module.exports = { connection };
