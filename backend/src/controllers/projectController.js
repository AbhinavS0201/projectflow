// src/controllers/projectController.js
const asyncHandler = require('../utils/asyncHandler');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { Activity } = require('../models/Message');

// @desc    Get all projects in workspace
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    'members.user': req.user._id,
  })
    .populate('owner', 'name initials')
    .populate('members.user', 'name initials status')
    .sort({ updatedAt: -1 });

  res.json({ success: true, count: projects.length, data: projects });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name initials jobTitle')
    .populate('members.user', 'name initials status jobTitle');

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  // Get task counts per status
  const taskStats = await Task.aggregate([
    { $match: { project: project._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({ success: true, data: { project, taskStats } });
});

// @desc    Create project
// @route   POST /api/projects
// @access  Private
const createProject = asyncHandler(async (req, res) => {
  const { name, description, dueDate, color, icon, members } = req.body;

  const project = await Project.create({
    name, description, dueDate, color, icon,
    workspace: req.user.workspace,
    owner: req.user._id,
    members: [
      { user: req.user._id, role: 'lead' },
      ...(members || []).map(id => ({ user: id, role: 'member' })),
    ],
    status: 'planning',
  });

  // Log activity
  await Activity.create({
    workspace: req.user.workspace,
    project: project._id,
    actor: req.user._id,
    action: 'project_created',
    meta: { projectName: project.name },
  });

  // Emit socket event
  const io = req.app.get('io');
  io.to(`workspace:${req.user.workspace}`).emit('project:created', project);

  res.status(201).json({ success: true, data: project });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = asyncHandler(async (req, res) => {
  let project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  }).populate('members.user', 'name initials status');

  const io = req.app.get('io');
  io.to(`project:${project._id}`).emit('project:updated', project);

  res.json({ success: true, data: project });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  // Delete all tasks in project
  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ success: true, message: 'Project deleted' });
});

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
const addMember = asyncHandler(async (req, res) => {
  const { userId, role = 'member' } = req.body;
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { members: { user: userId, role } } },
    { new: true }
  ).populate('members.user', 'name initials status');

  res.json({ success: true, data: project });
});

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, addMember };
