'use strict';

const winston = require('winston');
const config = require('../config');

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const devFormat = combine(colorize(), simple());
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
  level: config.server.isDev ? 'debug' : 'info',
  format: config.server.isDev ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console(),
    // In production you'd add File / CloudWatch / Datadog transports here
  ],
  // Prevent winston from throwing on unhandled exceptions inside transports
  exitOnError: false,
});

module.exports = logger;
