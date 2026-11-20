const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const controller = require('../controllers/contest.controller');

const router = express.Router();
router.get('/', controller.getContests);
router.post('/', authMiddleware, adminMiddleware, controller.createContest);
router.get('/mine', authMiddleware, controller.getMyContests);
router.post('/:id/register', authMiddleware, controller.registerForContest);
router.get('/:id', controller.getContestById);
module.exports = router;
