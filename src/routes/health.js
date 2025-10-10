const express = require('express');
const setupDB = require('../db');
const router = express.Router();

// Replace with your API version manually
const API_VERSION = 'v1.0.0';



router.get('/api/v1/health', async (req, res) => {
  const nodeVersion = process.version;
  const serverName =  process?.release?.name || 'nodeJs' 
  
  
  res.ok({ uptime: process.uptime(),serverName,nodeVersion,apiVerison:API_VERSION },'Server Running...');
});

module.exports = router; 