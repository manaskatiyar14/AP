const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const controller = require('../controllers/progress.controller');

const router = express.Router();
router.get('/me', authMiddleware, controller.getMyProgress);
module.exports = router;
