const express = require('express');
const router = express.Router();
const messageCtrl = require('../controllers/MessageController');

router.post('/', messageCtrl.sendMessage);
router.get('/:user1/:user2', messageCtrl.getConversation);

module.exports = router;
