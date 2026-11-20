const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const controller = require('../controllers/question.controller');

const router = express.Router();
router.get('/', controller.getQuestions);
router.get('/summary', controller.getQuestionSummary);
router.get('/admin', authMiddleware, adminMiddleware, controller.getAdminQuestions);
router.get('/:id', controller.getQuestionById);
router.post('/', authMiddleware, adminMiddleware, controller.createQuestion);
router.patch('/:id', authMiddleware, adminMiddleware, controller.updateQuestion);
router.delete('/:id', authMiddleware, adminMiddleware, controller.deleteQuestion);
module.exports = router;
