// src/models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters'],
  },
  description: { type: String, default: '' },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['lead', 'member', 'viewer'], default: 'member' },
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'review', 'done', 'archived'],
    default: 'planning',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  icon: { type: String, default: '🚀' },
  color: { type: String, default: '#3b82f6' },
  dueDate: { type: Date },
  startDate: { type: Date, default: Date.now },
  columns: {
    type: [String],
    default: ['todo', 'inprogress', 'review', 'done'],
  },
  tags: [String],
  progress: { type: Number, default: 0, min: 0, max: 100 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Virtual: task count
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true,
});

// Auto-calculate progress when tasks are updated (called externally)
projectSchema.methods.recalculateProgress = async function () {
  const Task = mongoose.model('Task');
  const total = await Task.countDocuments({ project: this._id });
  const done = await Task.countDocuments({ project: this._id, status: 'done' });
  this.progress = total > 0 ? Math.round((done / total) * 100) : 0;
  await this.save();
};

module.exports = mongoose.model('Project', projectSchema);
