const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');

router.post('/', MessageController.sendMessage);
router.get('/:user1/:user2', MessageController.getConversation);
router.put("/recall/:id", MessageController.recallMessage);
router.delete("/:id", MessageController.deleteMessage);

module.exports = router;
