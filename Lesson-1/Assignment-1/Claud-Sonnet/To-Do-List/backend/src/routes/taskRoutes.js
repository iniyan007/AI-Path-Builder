const express = require('express');
const router = express.Router();
const { getTasks, createTask, getTask, updateTask, deleteTask, permanentDeleteTask, updateTaskStatus, addSubtask, updateSubtask, deleteSubtask, addComment, deleteComment, getTaskActivity, reorderTasks } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.put('/reorder', reorderTasks);
router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
router.delete('/:id/permanent', permanentDeleteTask);
router.put('/:id/status', updateTaskStatus);
router.route('/:id/subtasks').post(addSubtask);
router.route('/:id/subtasks/:subtaskId').put(updateSubtask).delete(deleteSubtask);
router.route('/:id/comments').post(addComment);
router.route('/:id/comments/:commentId').delete(deleteComment);
router.get('/:id/activity', getTaskActivity);

module.exports = router;
