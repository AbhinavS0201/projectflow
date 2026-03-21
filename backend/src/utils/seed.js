// src/utils/seed.js — Run with: node src/utils/seed.js
require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');
const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clean up
  await Promise.all([User.deleteMany(), Workspace.deleteMany(), Project.deleteMany(), Task.deleteMany()]);

  // Users
  const users = await User.create([
    { name: 'Alex Kim', email: 'alex@projectflow.dev', password: 'password123', jobTitle: 'Lead Engineer' },
    { name: 'Sophia Reed', email: 'sophia@projectflow.dev', password: 'password123', jobTitle: 'UI/UX Designer' },
    { name: 'Marcus Jones', email: 'marcus@projectflow.dev', password: 'password123', jobTitle: 'Backend Engineer' },
    { name: 'Priya Lal', email: 'priya@projectflow.dev', password: 'password123', jobTitle: 'Product Manager' },
    { name: 'Tom Kurz', email: 'tom@projectflow.dev', password: 'password123', jobTitle: 'DevOps Engineer' },
  ]);

  // Workspace
  const workspace = await Workspace.create({
    name: 'Acme Corp',
    plan: 'pro',
    owner: users[0]._id,
    members: users.map(u => ({ user: u._id, role: u._id.equals(users[0]._id) ? 'admin' : 'member' })),
  });

  // Projects
  const projects = await Project.create([
    {
      name: 'ProjectFlow Dashboard', description: 'Real-time collaborative project management platform.',
      workspace: workspace._id, owner: users[0]._id, status: 'active',
      members: users.map(u => ({ user: u._id })), icon: '🚀', color: '#3b82f6',
      dueDate: new Date('2026-04-15'),
    },
    {
      name: 'Mobile App Redesign', description: 'Complete redesign of iOS and Android apps.',
      workspace: workspace._id, owner: users[1]._id, status: 'active',
      members: [users[0], users[1], users[3]].map(u => ({ user: u._id })),
      icon: '🎨', color: '#8b5cf6', dueDate: new Date('2026-05-30'),
    },
    {
      name: 'API Gateway v3', description: 'Rebuild API gateway with improved observability.',
      workspace: workspace._id, owner: users[2]._id, status: 'review',
      members: [users[2], users[4]].map(u => ({ user: u._id })),
      icon: '⚡', color: '#f59e0b', dueDate: new Date('2026-03-28'),
    },
  ]);

  // Tasks
  const taskData = [
    { title: 'Implement drag & drop kanban', status: 'inprogress', priority: 'high', project: projects[0]._id, assignees: [users[0]._id], tags: ['frontend', 'dnd-kit'], dueDate: new Date('2026-03-25'), progress: 65 },
    { title: 'Socket.io real-time sync', status: 'inprogress', priority: 'critical', project: projects[0]._id, assignees: [users[2]._id], tags: ['backend', 'realtime'], dueDate: new Date('2026-03-23'), progress: 40 },
    { title: 'JWT refresh token flow', status: 'review', priority: 'high', project: projects[0]._id, assignees: [users[4]._id], tags: ['auth', 'security'], progress: 90 },
    { title: 'Dashboard analytics charts', status: 'todo', priority: 'medium', project: projects[0]._id, assignees: [users[1]._id, users[3]._id], tags: ['recharts'], dueDate: new Date('2026-04-01') },
    { title: 'MongoDB aggregation pipeline', status: 'todo', priority: 'medium', project: projects[0]._id, assignees: [users[2]._id], tags: ['mongodb'] },
    { title: 'In-app notification system', status: 'inprogress', priority: 'medium', project: projects[0]._id, assignees: [users[3]._id], tags: ['notifications'], progress: 55 },
    { title: 'CI/CD pipeline setup', status: 'done', priority: 'high', project: projects[0]._id, assignees: [users[4]._id, users[0]._id], tags: ['devops', 'ci'], progress: 100 },
    { title: 'Write API documentation', status: 'done', priority: 'low', project: projects[0]._id, assignees: [users[4]._id], tags: ['docs'], progress: 100 },
    { title: 'Mobile nav redesign', status: 'todo', priority: 'high', project: projects[1]._id, assignees: [users[1]._id], tags: ['design', 'mobile'] },
    { title: 'Component library update', status: 'inprogress', priority: 'medium', project: projects[1]._id, assignees: [users[0]._id, users[1]._id], tags: ['components'], progress: 30 },
    { title: 'GraphQL schema design', status: 'inprogress', priority: 'high', project: projects[2]._id, assignees: [users[2]._id], tags: ['graphql', 'api'], progress: 70 },
    { title: 'Rate limiting implementation', status: 'review', priority: 'high', project: projects[2]._id, assignees: [users[4]._id], tags: ['security', 'api'], progress: 85 },
  ];

  await Task.create(taskData.map(t => ({
    ...t,
    workspace: workspace._id,
    reporter: users[0]._id,
    description: `Detailed implementation task for the ${t.title.toLowerCase()} feature.`,
  })));

  // Recalculate progress
  for (const p of projects) {
    await p.recalculateProgress();
  }

  console.log('✅ Seed complete!');
  console.log(`\n📧 Demo login credentials:`);
  console.log(`   Email: alex@projectflow.dev`);
  console.log(`   Password: password123\n`);
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
