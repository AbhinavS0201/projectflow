// src/controllers/taskController.js
const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { Activity } = require('../models/Message');

// @desc    Get tasks (by project or all workspace tasks)
// @route   GET /api/tasks?projectId=xxx&status=xxx&assignee=xxx
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const filter = { workspace: req.user.workspace };
  if (req.query.projectId) filter.project = req.query.projectId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignee) filter.assignees = req.query.assignee;
  if (req.query.priority) filter.priority = req.query.priority;

  const tasks = await Task.find(filter)
    .populate('assignees', 'name initials status')
    .populate('reporter', 'name initials')
    .populate('comments.author', 'name initials')
    .sort({ position: 1, createdAt: -1 });

  res.json({ success: true, count: tasks.length, data: tasks });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignees', 'name initials status jobTitle')
    .populate('reporter', 'name initials')
    .populate('comments.author', 'name initials')
    .populate('project', 'name color icon');

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  res.json({ success: true, data: task });
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { title, description, project, status, priority, assignees, tags, dueDate, storyPoints, subtasks } = req.body;

  if (!project) {
    return res.status(400).json({ success: false, message: 'Project ID is required' });
  }

  const task = await Task.create({
    title, description, project, status, priority,
    assignees: assignees || [],
    tags: tags || [],
    dueDate, storyPoints, subtasks,
    workspace: req.user.workspace,
    reporter: req.user._id,
  });

  // Update project progress
  const proj = await Project.findById(project);
  if (proj) await proj.recalculateProgress();

  // Log activity
  await Activity.create({
    workspace: req.user.workspace,
    project, task: task._id,
    actor: req.user._id,
    action: 'task_created',
    meta: { taskTitle: task.title, status: task.status, priority: task.priority },
  });

  const populated = await task.populate(['assignees', 'reporter']);

  // Emit to everyone in project room
  const io = req.app.get('io');
  io.to(`project:${project}`).emit('task:created', populated);
  io.to(`workspace:${req.user.workspace}`).emit('activity:new', {
    actor: req.user.name, action: 'created', taskTitle: task.title, time: new Date(),
  });

  res.status(201).json({ success: true, data: populated });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  let task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  }).populate('assignees', 'name initials status');

  const io = req.app.get('io');
  io.to(`project:${task.project}`).emit('task:updated', task);

  res.json({ success: true, data: task });
});

// @desc    Move task (change status) — triggers real-time update
// @route   PATCH /api/tasks/:id/status
// @access  Private
const moveTask = asyncHandler(async (req, res) => {
  const { status, position } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const oldStatus = task.status;
  task.status = status;
  if (position !== undefined) task.position = position;
  if (status === 'done') task.progress = 100;
  await task.save();

  // Recalculate project progress
  const proj = await Project.findById(task.project);
  if (proj) await proj.recalculateProgress();

  // Log activity
  await Activity.create({
    workspace: req.user.workspace,
    project: task.project,
    task: task._id,
    actor: req.user._id,
    action: 'task_moved',
    meta: { taskTitle: task.title, from: oldStatus, to: status },
  });

  // Real-time broadcast
  const io = req.app.get('io');
  io.to(`project:${task.project}`).emit('task:moved', {
    taskId: task._id,
    newStatus: status,
    oldStatus,
    movedBy: { name: req.user.name, initials: req.user.initials },
  });

  res.json({ success: true, data: task });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  await task.deleteOne();

  const proj = await Project.findById(task.project);
  if (proj) await proj.recalculateProgress();

  const io = req.app.get('io');
  io.to(`project:${task.project}`).emit('task:deleted', { taskId: req.params.id });

  res.json({ success: true, message: 'Task deleted' });
});

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.comments.push({ author: req.user._id, text });
  await task.save();
  await task.populate('comments.author', 'name initials');

  const io = req.app.get('io');
  const newComment = task.comments[task.comments.length - 1];
  io.to(`project:${task.project}`).emit('task:comment', { taskId: task._id, comment: newComment });

  res.status(201).json({ success: true, data: task.comments });
});

// @desc    Toggle subtask
// @route   PATCH /api/tasks/:id/subtasks/:subtaskId
// @access  Private
const toggleSubtask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  const subtask = task.subtasks.id(req.params.subtaskId);
  if (!subtask) return res.status(404).json({ success: false, message: 'Subtask not found' });

  subtask.completed = !subtask.completed;
  task.progress = task.subtaskProgress;
  await task.save();

  res.json({ success: true, data: task });
});

module.exports = { getTasks, getTask, createTask, updateTask, moveTask, deleteTask, addComment, toggleSubtask };
