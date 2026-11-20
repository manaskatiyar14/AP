const express = require('express');
const controller = require('../controllers/auth.controller');
const loginRateLimit = require('../middleware/login-rate-limit.middleware');

const router = express.Router();
router.post('/signup', controller.signup);
router.post('/login', loginRateLimit, controller.login);
router.post('/demo', controller.demoSession);
module.exports = router;
