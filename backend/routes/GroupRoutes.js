// ✅ GroupRoute.js
const express = require('express');
const router = express.Router();
const GroupController = require('../controllers/GroupController');

router.post('/create', GroupController.createGroup);
router.post('/join', GroupController.requestToJoinGroup);
router.post('/approve-member', GroupController.approveMember);
router.delete('/remove-member', GroupController.removeMember);
router.delete('/delete', GroupController.deleteGroup);

router.post('/post', GroupController.createGroupPost);
router.post('/approve-post', GroupController.approvePost);
router.delete('/delete-post', GroupController.deletePost);

router.get('/pending-posts/:groupId', GroupController.getPendingPosts);
router.get('/:groupId', GroupController.getGroupDetails);
router.put('/update', GroupController.updateGroup);

module.exports = router;