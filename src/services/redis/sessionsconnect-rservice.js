const getRedisClient = require("../../redis");

// Services for managing sessionId's with userId's in Redis (CRUD)
async function addUserSession(userId, sessionId) {
  await getRedisClient.sAdd(`user_sessions:${userId}`, sessionId);
}

async function getUserSessions(userId) {
  const sessionIds = await getRedisClient.sMembers(`user_sessions:${userId}`);
  const sessions = [];
  for (const id of sessionIds) {
    const data = await getRedisClient.hGetAll(`sessions:${id}`);
    if (Object.keys(data).length > 0) {
      sessions.push({ sessionId: id, ...data });
    }
  }
  return sessions;
}

async function removeUserSession(userId, sessionId) {
  await getRedisClient.sRem(`user_sessions:${userId}`, sessionId);
}


module.exports = {
  addUserSession,
  getUserSessions,
  removeUserSession 
};
