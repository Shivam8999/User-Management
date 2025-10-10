require('dotenv').config()


// Helper function to safely read env variables with optional defaults
function getEnv(name, defaultValue) {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing env: ${name}`);
  }
  return value || defaultValue;
}

module.exports = {
    DB_URL:getEnv('DB_URL'),
    REDIS_URL:getEnv('REDIS_URL'),
    SERVER_PORT:getEnv('SERVER_PORT',3000),
    REFRESHTOKEN_SECRET:getEnv('REFRESHTOKEN_SECRET','a25xZa0gQzPqMd95'),
    ACCESSTOKEN_SECRET:getEnv('ACCESSTOKEN_SECRET','a25xZa0gQzPqMd95'),
    GOOGLE_CLIENT_ID:getEnv('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET:getEnv('GOOGLE_CLIENT_SECRET'),
    REDIRECT_URI:getEnv('REDIRECT_URI'),
    KEEPS_LOG_DAYS:getEnv('KEEPS_LOG_DAYS',30),
    MAX_LOG_SIZE_MB:getEnv('MAX_LOG_SIZE_MB',100)
}