// src/routes/chat.js
const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, reactToMessage, deleteMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/:channel').get(getMessages).post(sendMessage);
router.post('/messages/:id/react', reactToMessage);
router.delete('/messages/:id', deleteMessage);

module.exports = router;
