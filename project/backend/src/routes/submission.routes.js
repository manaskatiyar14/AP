const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const controller = require('../controllers/submission.controller');

const router = express.Router();
router.use(authMiddleware);
router.post('/', controller.submitAnswer);
router.get('/mine', controller.getMySubmissions);
module.exports = router;
