// src/controllers/analyticsController.js
const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { Activity } = require('../models/Message');

// @desc    Task velocity (created vs completed per week)
// @route   GET /api/analytics/velocity?weeks=8
// @access  Private
const getVelocity = asyncHandler(async (req, res) => {
  const weeks = parseInt(req.query.weeks) || 8;
  const workspace = req.user.workspace;

  const results = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date();
    end.setDate(end.getDate() - i * 7);

    const [created, completed] = await Promise.all([
      Task.countDocuments({ workspace, createdAt: { $gte: start, $lt: end } }),
      Task.countDocuments({ workspace, status: 'done', updatedAt: { $gte: start, $lt: end } }),
    ]);

    results.push({ week: `W${weeks - i}`, created, completed, start, end });
  }

  res.json({ success: true, data: results });
});

// @desc    Task distribution by status / priority
// @route   GET /api/analytics/distribution
// @access  Private
const getDistribution = asyncHandler(async (req, res) => {
  const workspace = req.user.workspace;
  const projectId = req.query.projectId;
  const match = projectId ? { workspace, project: projectId } : { workspace };

  const [byStatus, byPriority] = await Promise.all([
    Task.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Task.aggregate([
      { $match: match },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({ success: true, data: { byStatus, byPriority } });
});

// @desc    Member performance (tasks completed, active, projects)
// @route   GET /api/analytics/members
// @access  Private
const getMemberPerformance = asyncHandler(async (req, res) => {
  const workspace = req.user.workspace;

  const performance = await Task.aggregate([
    { $match: { workspace } },
    { $unwind: '$assignees' },
    {
      $group: {
        _id: '$assignees',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'inprogress'] }, 1, 0] } },
      },
    },
    {
      $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
    },
    { $unwind: '$user' },
    {
      $project: {
        name: '$user.name', status: '$user.status', jobTitle: '$user.jobTitle',
        total: 1, completed: 1, inProgress: 1,
        completionRate: {
          $cond: [{ $gt: ['$total', 0] }, { $multiply: [{ $divide: ['$completed', '$total'] }, 100] }, 0],
        },
      },
    },
    { $sort: { completed: -1 } },
  ]);

  res.json({ success: true, data: performance });
});

// @desc    Recent activity log
// @route   GET /api/analytics/activity?limit=20
// @access  Private
const getActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const activities = await Activity.find({ workspace: req.user.workspace })
    .populate('actor', 'name initials')
    .populate('task', 'title')
    .populate('project', 'name')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ success: true, data: activities });
});

// @desc    Project burndown
// @route   GET /api/analytics/burndown/:projectId
// @access  Private
const getBurndown = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  const totalTasks = await Task.countDocuments({ project: project._id });
  const start = project.startDate || project.createdAt;
  const end = project.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  const points = [];
  for (let i = 0; i <= Math.min(days, 30); i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    if (date > new Date()) break;
    const done = await Task.countDocuments({
      project: project._id, status: 'done', updatedAt: { $lte: date },
    });
    const ideal = Math.max(0, totalTasks - Math.round((totalTasks / days) * i));
    points.push({ date: date.toISOString().split('T')[0], remaining: totalTasks - done, ideal });
  }

  res.json({ success: true, data: { project: project.name, totalTasks, points } });
});

module.exports = { getVelocity, getDistribution, getMemberPerformance, getActivity, getBurndown };


// ============================================
// src/controllers/memberController.js
// ============================================
const getMembers = asyncHandler(async (req, res) => {
  const Workspace = require('../models/Workspace');
  const workspace = await Workspace.findOne({ 'members.user': req.user._id })
    .populate('members.user', 'name email initials status jobTitle lastSeen createdAt');

  if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

  const members = workspace.members.map(m => ({
    ...m.user.toJSON(),
    workspaceRole: m.role,
    joinedAt: m.joinedAt,
  }));

  res.json({ success: true, count: members.length, data: members });
});

const inviteMember = asyncHandler(async (req, res) => {
  // In production, send invite email via SendGrid/Resend
  const { email, role = 'member' } = req.body;
  res.json({ success: true, message: `Invite sent to ${email}` });
});

const removeMember = asyncHandler(async (req, res) => {
  const Workspace = require('../models/Workspace');
  await Workspace.findOneAndUpdate(
    { 'members.user': req.user._id },
    { $pull: { members: { user: req.params.userId } } }
  );
  res.json({ success: true, message: 'Member removed' });
});

module.exports.memberController = { getMembers, inviteMember, removeMember };
