
const getRedisClient = require("../../redis");
// Services for managing analytics in Redis (CRUD)
async function setAnalytics(key, value) {
  await getRedisClient.set(`analytics:${key}`, value);
}

async function getAnalytics(key) {
  return await getRedisClient.get(`analytics:${key}`);
}

async function incrementAnalytics(key, by = 1) {
  return await getRedisClient.incrBy(`analytics:${key}`, by);
}

async function decrementAnalytics(key, by = 1) {
  return await getRedisClient.decrBy(`analytics:${key}`, by);
}

async function deleteAnalytics(key) {
  return await getRedisClient.del(`analytics:${key}`);
}

module.exports = {
  setAnalytics,
  getAnalytics,
  incrementAnalytics,
  decrementAnalytics,
  deleteAnalytics
};
