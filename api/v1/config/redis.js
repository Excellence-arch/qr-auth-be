
const url = new URL(process.env.REDIS_URL)
const redisConfig = {
  redis: {
    port: url.port,
    host: url.hostname || '127.0.0.1',
    username: url.username,
    password: url.password || undefined,
    tls: {}
  },
  // Enable redis cluster if needed
  // cluster: [
  //   { port: 6379, host: '127.0.0.1' },
  // ]
};

module.exports = redisConfig;