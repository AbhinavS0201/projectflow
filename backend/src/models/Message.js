// src/models/Message.js
const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const messageSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // null = global channel
  channel: { type: String, required: true, default: 'general' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: [4000, 'Message too long'] },
  attachments: [{
    name: String,
    url: String,
    type: String,
  }],
  reactions: [reactionSchema],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  edited: { type: Boolean, default: false },
  editedAt: Date,
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ workspace: 1, channel: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);


// src/models/Activity.js — export second model from same file
const activitySchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: [
      'task_created', 'task_updated', 'task_deleted', 'task_moved',
      'task_assigned', 'comment_added', 'project_created', 'project_updated',
      'member_added', 'member_removed', 'file_uploaded',
    ],
    required: true,
  },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  // e.g. meta: { from: 'todo', to: 'inprogress', taskTitle: '...' }
}, { timestamps: true });

activitySchema.index({ workspace: 1, createdAt: -1 });
activitySchema.index({ project: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
module.exports.Activity = Activity;
