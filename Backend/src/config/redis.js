const { env } = require('./env');

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT
};

module.exports = { connection };
