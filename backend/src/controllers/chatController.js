// src/controllers/chatController.js
const asyncHandler = require('../utils/asyncHandler');
const Message = require('../models/Message');

// @desc    Get messages for a channel
// @route   GET /api/chat/:channel?limit=50&before=<messageId>
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const { channel } = req.params;
  const limit = parseInt(req.query.limit) || 50;

  const filter = { workspace: req.user.workspace, channel, deleted: false };
  if (req.query.before) {
    filter._id = { $lt: req.query.before };
  }

  const messages = await Message.find(filter)
    .populate('author', 'name initials status')
    .populate('replyTo', 'text author')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ success: true, count: messages.length, data: messages.reverse() });
});

// @desc    Send message (REST fallback — prefer Socket.io)
// @route   POST /api/chat/:channel
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { text, replyTo } = req.body;
  const { channel } = req.params;

  const message = await Message.create({
    workspace: req.user.workspace,
    channel, text, replyTo,
    author: req.user._id,
  });

  await message.populate('author', 'name initials status');

  // Emit to everyone in the channel room
  const io = req.app.get('io');
  io.to(`channel:${req.user.workspace}:${channel}`).emit('chat:message', message);

  res.status(201).json({ success: true, data: message });
});

// @desc    Add reaction to message
// @route   POST /api/chat/messages/:id/react
// @access  Private
const reactToMessage = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

  const existing = message.reactions.find(r => r.emoji === emoji);
  if (existing) {
    const idx = existing.users.indexOf(req.user._id);
    if (idx > -1) {
      existing.users.splice(idx, 1);
      if (existing.users.length === 0) {
        message.reactions = message.reactions.filter(r => r.emoji !== emoji);
      }
    } else {
      existing.users.push(req.user._id);
    }
  } else {
    message.reactions.push({ emoji, users: [req.user._id] });
  }

  await message.save();

  const io = req.app.get('io');
  io.to(`channel:${message.workspace}:${message.channel}`).emit('chat:reaction', {
    messageId: message._id, reactions: message.reactions,
  });

  res.json({ success: true, data: message.reactions });
});

// @desc    Delete message
// @route   DELETE /api/chat/messages/:id
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
  if (!message.author.equals(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
  }

  message.deleted = true;
  message.text = 'This message was deleted';
  await message.save();

  const io = req.app.get('io');
  io.to(`channel:${message.workspace}:${message.channel}`).emit('chat:deleted', { messageId: message._id });

  res.json({ success: true, message: 'Message deleted' });
});

module.exports = { getMessages, sendMessage, reactToMessage, deleteMessage };
