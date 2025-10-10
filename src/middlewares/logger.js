const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const {KEEPS_LOG_DAYS} = require("../../loadenv")
const path = require("path");

const filePath= path.join(__dirname, "..", "..");

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new transports.Console(),
    //this configuratation makes sure that a new log file is created every day but if file size increases them maxSize, it will create new file for the same day
    new DailyRotateFile({
      filename: `${filePath}/app-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,     // compress old logs
      maxSize: '100m',          // max size of a log file
      maxFiles: `${KEEPS_LOG_DAYS}d`          // keep logs for 30 days as this is enough time for any trouble shooting you need
    })
  ]
});

module.exports = logger; 