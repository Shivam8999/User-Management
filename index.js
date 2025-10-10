const express = require('express');
const dbsetup = require('./src/db/index');
const manageuserrouter = require('./src/routes/ManageUserRoutes.js');
const cookieParser = require('cookie-parser');
const authrouter = require('./src/auth/authrouter.js');
const bodyParser = require('body-parser');
const getRedisClient = require('./src/redis.js');
const loadEnv = require('./loadenv.js');
const adminRouter = require('./src/routes/AdminUserRouter.js');
const logger = require('./src/middlewares/logger');
const resHandler = require('./src/middlewares/resHandler');
const errorHandler = require('./src/middlewares/errorHandler');
const applySecurity = require('./src/middlewares/security');
const setupSwagger = require('./src/swagger');
const healthRouter = require('./src/routes/health');
const { resStatusHandler } = require('./src/middlewares/resHandler.js')

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Security middlewares
applySecurity(app);

// Consistent response handler
app.use(resStatusHandler)

// Trust proxy if behind load balancer or reverse proxy
// setupSwagger(app);

// Health check
app.use(healthRouter);

app.use('/api/v1/', manageuserrouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/auth', authrouter);

app.get('/api/v1', (req, res) => {
  res.send(`User Management service running on port ${loadEnv.SERVER_PORT}`);
});

// Error handler (should be last)
app.use(errorHandler);

app.listen(loadEnv.SERVER_PORT, '0.0.0.0', async () => {
  try {
    logger.info('Starting server');
    await getRedisClient();
    await dbsetup();
    logger.info(`Server is running on Port : ${loadEnv.SERVER_PORT}`);
  } catch (error) {
    logger.error(error);
  }
});


const shutdown = async (signal) => {
  console.log(`\n📦 Received ${signal}. Shutting down gracefully...`);

  // Stop accepting new connections
  server.close(async (err) => {
    if (err) {
      console.error("❌ Error closing server:", err);
      process.exit(1);
    }

    try {
      // Close DB connections
      await mongoose.connection.close(false);
      await getRedisClient.quit()

      console.log("✅ DB connections closed");

      console.log("👋 Shutdown complete. Exiting...");
      process.exit(0);
    } catch (shutdownErr) {
      console.error("❌ Error during shutdown:", shutdownErr);
      process.exit(1);
    }
  });
};