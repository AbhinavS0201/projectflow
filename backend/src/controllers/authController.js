// src/controllers/authController.js
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');

// @desc    Register user + create workspace
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, workspaceName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  // 1) Create user FIRST so we have a real _id for workspace owner
  const user = await User.create({
    name,
    email,
    password,
    role: 'owner',
  });

  // 2) Create workspace with the real user _id as owner
  const workspace = await Workspace.create({
    name: workspaceName || `${name}'s Workspace`,
    owner: user._id,
    members: [{ user: user._id, role: 'admin' }],
  });

  // 3) Link workspace back to user
  user.workspace = workspace._id;

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push(refreshToken);
  await user.save();

  res.status(201).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        jobTitle: user.jobTitle,
        initials: user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      },
      workspace: { _id: workspace._id, name: workspace.name, plan: workspace.plan },
      accessToken,
      refreshToken,
    },
  });
});

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const workspace = await Workspace.findOne({ 'members.user': user._id });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push(refreshToken);
  if (user.refreshTokens.length > 5) user.refreshTokens.shift();
  user.status = 'online';
  user.lastSeen = new Date();
  await user.save();

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        jobTitle: user.jobTitle,
        status: user.status,
        initials: user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      },
      workspace: workspace ? { _id: workspace._id, name: workspace.name, plan: workspace.plan } : null,
      accessToken,
      refreshToken,
    },
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token required' });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    return res.status(401).json({ success: false, message: 'Refresh token revoked' });
  }

  user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
  const newRefreshToken = generateRefreshToken(user._id);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  const accessToken = generateAccessToken(user._id);

  res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
});

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const user = await User.findById(req.user._id).select('+refreshTokens');
  if (user) {
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.status = 'offline';
    user.lastSeen = new Date();
    await user.save();
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const workspace = await Workspace.findOne({ 'members.user': req.user._id });
  res.json({ success: true, data: { user, workspace } });
});

// @desc    Update profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, jobTitle, status } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, jobTitle, status },
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: user });
});

module.exports = { register, login, refresh, logout, getMe, updateMe };
