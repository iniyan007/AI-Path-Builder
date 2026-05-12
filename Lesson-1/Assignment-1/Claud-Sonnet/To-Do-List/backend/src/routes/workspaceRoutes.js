const express = require('express');
const router = express.Router();
const { getWorkspaces, createWorkspace, getWorkspace, updateWorkspace, deleteWorkspace, inviteMember, acceptInvite, removeMember, updateMemberRole } = require('../controllers/workspaceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getWorkspaces).post(createWorkspace);
router.route('/:id').get(getWorkspace).put(updateWorkspace).delete(deleteWorkspace);
router.post('/:id/invite', inviteMember);
router.post('/invite/accept/:token', acceptInvite);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/members/:userId/role', updateMemberRole);

module.exports = router;
