const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/', verifyToken, taskController.getTasks);
router.get('/summary', verifyToken, taskController.getTaskSummary);
router.post('/', verifyToken, taskController.createTask);
router.put('/complete/:idtask', verifyToken, taskController.completeTask);
router.put('/hide-completed-visible', verifyToken, taskController.hideCompletedVisibleTasks);
router.delete('/completed/all', verifyToken, taskController.clearCompletedTasks);
router.delete('/:idtask', verifyToken, taskController.deleteTask);
router.put('/:idtask', verifyToken, taskController.updateTask);

module.exports = router;
