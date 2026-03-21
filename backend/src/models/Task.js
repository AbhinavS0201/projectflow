// src/models/Task.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
  attachments: [String],
}, { timestamps: true });

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: { type: String, default: '' },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  status: {
    type: String,
    enum: ['todo', 'inprogress', 'review', 'done'],
    default: 'todo',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  tags: [{ type: String, trim: true }],
  dueDate: { type: Date },
  startDate: { type: Date },
  estimatedHours: { type: Number, default: 0 },
  loggedHours: { type: Number, default: 0 },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  subtasks: [subtaskSchema],
  comments: [commentSchema],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  }],
  position: { type: Number, default: 0 }, // For ordering within column
  watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  storyPoints: { type: Number, default: 0 },
  sprint: { type: String, default: '' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Indexes for faster queries
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ workspace: 1 });
taskSchema.index({ dueDate: 1 });

// Virtual: subtask completion
taskSchema.virtual('subtaskProgress').get(function () {
  if (!this.subtasks.length) return 0;
  const done = this.subtasks.filter(s => s.completed).length;
  return Math.round((done / this.subtasks.length) * 100);
});

module.exports = mongoose.model('Task', taskSchema);
