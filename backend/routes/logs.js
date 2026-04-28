const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getLogs } = require('../controllers/logController');

router.get('/', verifyToken, getLogs);

module.exports = router;
