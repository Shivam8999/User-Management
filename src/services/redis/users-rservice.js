
const getRedisClient = require("../../redis");

// Email <-> UserId mapping
// Services for managing email and userId in Redis (CRUD)
async function setUserEmail(email, userId) {
  await getRedisClient.set(`email:${email}`, userId);
}

async function getUserIdByEmail(email) {
  return await getRedisClient.get(`email:${email}`);
}

async function deleteUserEmail(email) {
  return await getRedisClient.del(`email:${email}`);
}

// Services for managing user profile in Redis (CRUD)
//paylod will have object of email,status,name,role and isVerified
async function createUser(userId,payload) {
  await getRedisClient.hSet(`user:${userId}`, payload);
}

async function getUser(userId) {
  return await getRedisClient.hGetAll(`user:${userId}`);
}

async function updateUser(userId, fields) {
  await getRedisClient.hSet(`user:${userId}`, fields);
}

async function deleteUser(userId) {
  return await getRedisClient.del(`user:${userId}`);
}

module.exports = {
  // User email map
  setUserEmail,
  getUserIdByEmail,
  deleteUserEmail,

  // User profile
  createUser,
  getUser,
  updateUser,
  deleteUser
};
