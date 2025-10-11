
const getRedisClient = require("../../redis");
// Services for managing sessions in Redis (CRUD)
//sessionId = refreshToken
//sessionData = accessTokens, 
async function createSession(sessionId, sessionData) {
  await getRedisClient.hSet(`sessions:${sessionId}`, sessionData);
}

async function getSession(sessionId) {
  return await getRedisClient.hGetAll(`sessions:${sessionId}`);
}

async function updateSession(sessionId, fields) {
  await getRedisClient.hSet(`sessions:${sessionId}`, fields);
}

async function deleteSession(sessionId) {
  return await getRedisClient.del(`sessions:${sessionId}`);
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  deleteSession,
};
