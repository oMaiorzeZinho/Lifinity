const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const verifyToken = require('../middlewares/authMiddleware');


router.get('/', verifyToken, taskController.getTasks);
router.post('/', verifyToken, taskController.createTask);
router.get('/summary', verifyToken, taskController.getTaskSummary);
router.put('/complete/:idtask', verifyToken, taskController.completeTask);
router.delete('/:idtask', verifyToken, taskController.deleteTask);
router.delete('/completed/all', verifyToken, taskController.clearCompletedTasks);

module.exports = router;
