const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const controller = require('../controllers/user.controller');

const router = express.Router();
router.use(authMiddleware);
router.get('/me', controller.getMe);
router.patch('/me', controller.updateMe);
router.patch('/me/password', controller.changePassword);
module.exports = router;
