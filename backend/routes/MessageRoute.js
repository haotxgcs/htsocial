const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const C       = require('../controllers/MessageController');
const { uploadMessageMedia } = require('../middleware/uploadCloudinary');

// Inbox summary (conversations list)
router.get('/contacts',                  auth, C.getContacts);

// Unread count (for navbar badge)
router.get('/unread-count',              auth, C.getUnreadCount);

// Send message
router.post('/',                         auth, C.sendMessage);

// Get conversation between 2 users (paginated)
router.get('/:user1/:user2',             auth, C.getConversation);

// Update single message status (delivered/seen)
router.patch('/:id/status',              auth, C.updateStatus);

// Mark all messages from a partner as seen
router.patch('/seen/:partnerId',         auth, C.markAllSeen);

// Recall message (thu hồi — within 10 min)
router.put('/recall/:id',                auth, C.recallMessage);

// Soft delete message (only for current user)
router.delete('/:id',                    auth, C.deleteMessage);

// React to message
router.post('/:id/react',               auth, C.reactToMessage);

// Send message with media (up to 10 files, Cloudinary)
router.post('/media',                   auth, uploadMessageMedia.array('media', 10), C.sendMediaMessage);

// Delete entire conversation with a partner (soft delete)
router.delete('/conversation/:partnerId', auth, C.deleteConversation);

module.exports = router;