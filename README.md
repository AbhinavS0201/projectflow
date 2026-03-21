# 🚀 ProjectFlow — Full-Stack Real-Time Project Management

A complete Jira/Trello-like collaborative project management tool.

## 🗂 Project Structure

```
projectflow/
├── backend/                    ← Node.js + Express + MongoDB + Socket.io
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           ← MongoDB connection
│   │   ├── models/
│   │   │   ├── User.js         ← User schema
│   │   │   ├── Workspace.js    ← Workspace schema
│   │   │   ├── Project.js      ← Project schema
│   │   │   ├── Task.js         ← Task schema (with subtasks, comments)
│   │   │   ├── Message.js      ← Chat message schema
│   │   │   └── Activity.js     ← Activity log schema
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   ├── chatController.js
│   │   │   ├── memberController.js
│   │   │   └── analyticsController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   ├── tasks.js
│   │   │   ├── chat.js
│   │   │   ├── members.js
│   │   │   └── analytics.js
│   │   ├── middleware/
│   │   │   ├── auth.js         ← JWT verify middleware
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── socket/
│   │   │   └── socketHandler.js ← Socket.io events
│   │   └── utils/
│   │       ├── generateToken.js
│   │       └── asyncHandler.js
│   ├── .env.example
│   ├── package.json
│   └── server.js               ← Entry point
│
├── frontend/                   ← React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── KanbanColumn.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── PresenceBar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── KanbanBoard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Members.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Login.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useTasks.js
│   │   │   ├── useSocket.js
│   │   │   └── useProjects.js
│   │   ├── utils/
│   │   │   └── api.js          ← Axios instance
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── package.json                ← Root: runs both with concurrently
```

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 2. Clone & Install
```bash
# Install all dependencies
npm run install:all
```

### 3. Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### 4. Run Development
```bash
# From root — starts both backend (port 5000) and frontend (port 5173)
npm run dev
```

### 5. Open App
```
Frontend: http://localhost:5173
Backend API: http://localhost:5000/api
```

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| State | React Context + useReducer |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Real-time | Socket.io |
| Auth | JWT + Refresh Tokens (Redis) |
| Charts | Recharts |
| Deploy | Render (backend) + Vercel (frontend) |

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login + get tokens |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Invalidate refresh token |
| GET | /api/auth/me | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | Get all workspace projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| GET | /api/projects/:id/analytics | Project analytics |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks?projectId=xxx | Get tasks by project |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| PATCH | /api/tasks/:id/status | Move task (triggers socket) |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/tasks/:id/comments | Add comment |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/chat/:channel | Get messages |
| POST | /api/chat/:channel | Send message |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/velocity | Task velocity over time |
| GET | /api/analytics/burndown | Sprint burndown |
| GET | /api/analytics/members | Per-member performance |

## 🔌 Socket.io Events

### Client → Server
```js
socket.emit('task:move', { taskId, newStatus, projectId })
socket.emit('chat:message', { channel, text })
socket.emit('presence:join', { projectId })
socket.emit('typing:start', { channel })
socket.emit('typing:stop', { channel })
```

### Server → Client
```js
socket.on('task:moved', ({ taskId, newStatus, movedBy })
socket.on('task:created', (task))
socket.on('task:updated', (task))
socket.on('chat:message', (message))
socket.on('presence:update', (onlineUsers))
socket.on('typing:update', ({ user, channel, isTyping }))
socket.on('activity:new', (activity))
```

## 🚀 Deployment

### Backend → Render
1. Push to GitHub
2. Create new Web Service on Render
3. Set root directory: `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables

### Frontend → Vercel
1. Import repository to Vercel
2. Set root directory: `frontend`
3. Framework: Vite
4. Add `VITE_API_URL` and `VITE_SOCKET_URL` env vars
