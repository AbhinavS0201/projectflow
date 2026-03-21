// src/socket/socketHandler.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const { Activity } = require('../models/Message');

// Track online users: { socketId -> { userId, name, initials, workspaceId, projectIds[] } }
const onlineUsers = new Map();

const initSocket = (io) => {
  // ─── Auth middleware for socket connections ──────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name initials status workspace');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: ${user.name} (${socket.id})`);

    // Store user in online map
    onlineUsers.set(socket.id, {
      userId: user._id.toString(),
      name: user.name,
      initials: user.initials,
      workspaceId: user.workspace?.toString(),
    });

    // Update user status
    await User.findByIdAndUpdate(user._id, { status: 'online', lastSeen: new Date() });

    // ─── Join rooms ──────────────────────────────────
    socket.on('join:workspace', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      // Broadcast presence update
      const workspaceUsers = getWorkspaceUsers(workspaceId);
      io.to(`workspace:${workspaceId}`).emit('presence:update', workspaceUsers);
    });

    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`  👥 ${user.name} joined project room: ${projectId}`);
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('join:channel', ({ workspaceId, channel }) => {
      socket.join(`channel:${workspaceId}:${channel}`);
    });

    // ─── Task events ─────────────────────────────────
    socket.on('task:move', async ({ taskId, newStatus, projectId, position }) => {
      try {
        const Task = require('../models/Task');
        const Project = require('../models/Project');

        const task = await Task.findById(taskId);
        if (!task) return;

        const oldStatus = task.status;
        task.status = newStatus;
        if (position !== undefined) task.position = position;
        if (newStatus === 'done') task.progress = 100;
        await task.save();

        const proj = await Project.findById(task.project);
        if (proj) await proj.recalculateProgress();

        // Log activity
        await Activity.create({
          workspace: user.workspace,
          project: task.project,
          task: task._id,
          actor: user._id,
          action: 'task_moved',
          meta: { taskTitle: task.title, from: oldStatus, to: newStatus },
        });

        // Broadcast to project room (everyone including sender)
        io.to(`project:${projectId || task.project}`).emit('task:moved', {
          taskId,
          newStatus,
          oldStatus,
          position,
          movedBy: { name: user.name, initials: user.initials },
          updatedAt: new Date(),
        });

        // Activity feed update
        io.to(`workspace:${user.workspace}`).emit('activity:new', {
          actor: { name: user.name, initials: user.initials },
          action: 'task_moved',
          meta: { taskTitle: task.title, from: oldStatus, to: newStatus },
          time: new Date(),
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to move task', error: err.message });
      }
    });

    // ─── Chat events ─────────────────────────────────
    socket.on('chat:message', async ({ channel, text, workspaceId, replyTo }) => {
      try {
        const message = await Message.create({
          workspace: workspaceId || user.workspace,
          channel,
          text,
          author: user._id,
          replyTo: replyTo || null,
        });

        await message.populate('author', 'name initials status');

        // Broadcast to everyone in the channel
        io.to(`channel:${workspaceId || user.workspace}:${channel}`).emit('chat:message', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── Typing indicators ───────────────────────────
    socket.on('typing:start', ({ channel, workspaceId }) => {
      socket.to(`channel:${workspaceId}:${channel}`).emit('typing:update', {
        user: { name: user.name, initials: user.initials },
        channel,
        isTyping: true,
      });
    });

    socket.on('typing:stop', ({ channel, workspaceId }) => {
      socket.to(`channel:${workspaceId}:${channel}`).emit('typing:update', {
        user: { name: user.name, initials: user.initials },
        channel,
        isTyping: false,
      });
    });

    // ─── Presence ────────────────────────────────────
    socket.on('presence:ping', ({ workspaceId }) => {
      const users = getWorkspaceUsers(workspaceId);
      socket.emit('presence:update', users);
    });

    // ─── Disconnect ──────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ Socket disconnected: ${user.name}`);
      onlineUsers.delete(socket.id);

      // Update user status
      await User.findByIdAndUpdate(user._id, { status: 'offline', lastSeen: new Date() });

      // Broadcast updated presence to workspace
      if (user.workspace) {
        const workspaceUsers = getWorkspaceUsers(user.workspace.toString());
        io.to(`workspace:${user.workspace}`).emit('presence:update', workspaceUsers);
      }
    });
  });
};

// Helper: get all online users in a workspace
const getWorkspaceUsers = (workspaceId) => {
  const users = [];
  for (const [, data] of onlineUsers.entries()) {
    if (data.workspaceId === workspaceId) {
      users.push({ userId: data.userId, name: data.name, initials: data.initials });
    }
  }
  return users;
};

module.exports = { initSocket };
