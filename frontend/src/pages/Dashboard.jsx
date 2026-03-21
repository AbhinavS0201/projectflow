// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PRIORITY_COLORS = { critical: '#f43f5e', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };
const STATUS_COLORS   = { todo: '#4a5568', inprogress: '#3b82f6', review: '#f59e0b', done: '#10b981' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [activity, setActivity] = useState([]);
  const [stats, setStats]       = useState({ total: 0, done: 0, inProgress: 0, activeProjects: 0 });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/projects'),
      api.get('/tasks'),
      api.get('/analytics/activity?limit=10'),
    ]).then(([p, t, a]) => {
      const projs = p.data.data || [];
      const taskList = t.data.data || [];
      setProjects(projs);
      setTasks(taskList);
      setActivity(a.data.data || []);
      setStats({
        total: taskList.length,
        done: taskList.filter(t => t.status === 'done').length,
        inProgress: taskList.filter(t => t.status === 'inprogress').length,
        activeProjects: projs.filter(p => p.status === 'active').length,
      });
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;

  const STAT_CARDS = [
    { label: 'Total Tasks', value: stats.total, color: '#3b82f6', icon: '◈', delta: '+12%' },
    { label: 'Completed', value: stats.done, color: '#10b981', icon: '✓', delta: '+8%' },
    { label: 'In Progress', value: stats.inProgress, color: '#f59e0b', icon: '⟳', delta: '→' },
    { label: 'Active Projects', value: stats.activeProjects, color: '#f43f5e', icon: '◉', delta: `+${projects.length}` },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening across your workspace today.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden hover:-translate-y-0.5 transition-transform group">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: s.color }} />
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">{s.label}</div>
            <div className="font-display text-3xl font-extrabold tracking-tighter mb-2" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-emerald-400">{s.delta} this week</div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl opacity-[0.06]">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Projects + Activity */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-5">
        {/* Active projects */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <div className="font-display font-bold text-sm">Active Projects</div>
              <div className="text-[11px] text-gray-600 mt-0.5">Track your ongoing work</div>
            </div>
            <button onClick={() => navigate('/projects')}
              className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/[0.08] transition-all">
              View all →
            </button>
          </div>
          {projects.filter(p => p.status !== 'done').slice(0, 5).map(p => (
            <div key={p._id} onClick={() => navigate(`/board/${p._id}`)}
              className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${p.color}18` }}>
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{p.name}</div>
                <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${p.progress}%`, background: p.color }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-display text-sm font-bold">{p.progress}%</div>
                <div className="text-[11px] text-gray-600">{p.members?.length || 0} members</div>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <div className="text-3xl mb-3 opacity-40">◈</div>
              <div className="text-sm">No projects yet</div>
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="font-display font-bold text-sm">Activity Feed</div>
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
          </div>
          <div className="divide-y divide-white/[0.04] max-h-[400px] overflow-y-auto">
            {activity.map((a, i) => (
              <div key={a._id || i} className="flex gap-3 px-4 py-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {a.actor?.initials || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-gray-300 leading-relaxed">
                    <span className="font-semibold text-white">{a.actor?.name}</span>{' '}
                    {formatAction(a)}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-0.5">{timeAgo(a.createdAt)}</div>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <div className="text-center py-10 text-gray-600 text-sm">No activity yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="font-display font-bold text-sm">Upcoming Deadlines</div>
          <button onClick={() => navigate('/board')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View board →</button>
        </div>
        <div className="grid grid-cols-3 gap-0 divide-x divide-white/[0.05]">
          {tasks.filter(t => t.dueDate && t.status !== 'done').slice(0, 6).map(task => (
            <div key={task._id} className="px-5 py-4 hover:bg-white/[0.02] transition-all">
              <div className="flex items-start gap-3">
                <div className="w-0.5 h-full min-h-[40px] rounded flex-shrink-0 mt-1"
                  style={{ background: PRIORITY_COLORS[task.priority] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{task.title}</div>
                  <div className="text-[11px] text-gray-500 mt-1">Due {new Date(task.dueDate).toLocaleDateString()}</div>
                  <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide`}
                    style={{ background: `${PRIORITY_COLORS[task.priority]}18`, color: PRIORITY_COLORS[task.priority] }}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-white/[0.05] rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/[0.04] rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="h-80 bg-white/[0.04] rounded-2xl" />
        <div className="h-80 bg-white/[0.04] rounded-2xl" />
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatAction(a) {
  const map = {
    task_created: () => `created "${a.task?.title || a.meta?.taskTitle}"`,
    task_moved: () => `moved "${a.task?.title || a.meta?.taskTitle}" → ${a.meta?.to}`,
    task_updated: () => `updated "${a.task?.title || a.meta?.taskTitle}"`,
    project_created: () => `created project "${a.project?.name || a.meta?.projectName}"`,
    comment_added: () => `commented on "${a.task?.title || 'a task'}"`,
    member_added: () => `added a member to the workspace`,
  };
  return (map[a.action] || (() => a.action))();
}
