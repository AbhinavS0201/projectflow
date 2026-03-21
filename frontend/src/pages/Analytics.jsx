// src/pages/Analytics.jsx
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import api from '../utils/api';

const COLORS = { todo: '#4a5568', inprogress: '#3b82f6', review: '#f59e0b', done: '#10b981' };
const PIE_COLORS = ['#4a5568', '#3b82f6', '#f59e0b', '#10b981'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-white mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [velocity, setVelocity] = useState([]);
  const [dist, setDist] = useState({ byStatus: [], byPriority: [] });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/velocity?weeks=8'),
      api.get('/analytics/distribution'),
      api.get('/analytics/members'),
    ]).then(([v, d, m]) => {
      setVelocity(v.data.data || []);
      setDist(d.data.data || { byStatus: [], byPriority: [] });
      setMembers(m.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const totalTasks = dist.byStatus.reduce((s, d) => s + d.count, 0);

  const STAT_CARDS = [
    { label: 'Velocity', value: `${velocity.slice(-1)[0]?.completed || 0}`, unit: 'tasks/wk', color: '#3b82f6' },
    { label: 'Completion Rate', value: totalTasks > 0 ? `${Math.round(((dist.byStatus.find(s => s._id === 'done')?.count || 0) / totalTasks) * 100)}%` : '—', unit: 'this sprint', color: '#10b981' },
    { label: 'In Progress', value: dist.byStatus.find(s => s._id === 'inprogress')?.count || 0, unit: 'tasks', color: '#f59e0b' },
    { label: 'Total Tasks', value: totalTasks, unit: 'across all projects', color: '#8b5cf6' },
  ];

  if (loading) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-48 bg-white/[0.05] rounded-xl" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white/[0.04] rounded-2xl" />)}</div>
      <div className="grid grid-cols-2 gap-5">{[...Array(2)].map((_, i) => <div key={i} className="h-72 bg-white/[0.04] rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Project performance & team metrics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: s.color }} />
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">{s.label}</div>
            <div className="font-display text-3xl font-extrabold tracking-tighter mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-gray-600">{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-[2fr_1fr] gap-5">
        {/* Velocity bar chart */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="font-display font-bold text-sm">Task Velocity</div>
              <div className="text-xs text-gray-500 mt-0.5">Created vs Completed per week</div>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Created</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Completed</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={velocity} barGap={4}>
              <XAxis dataKey="week" tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="created" name="Created" fill="#3b82f6" radius={[4,4,0,0]} opacity={0.7} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task distribution donut */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
          <div className="font-display font-bold text-sm mb-1">Task Distribution</div>
          <div className="text-xs text-gray-500 mb-4">Current status breakdown</div>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <PieChart width={160} height={160}>
                <Pie data={dist.byStatus} cx={75} cy={75} innerRadius={50} outerRadius={72}
                  dataKey="count" paddingAngle={3}>
                  {dist.byStatus.map((entry, index) => (
                    <Cell key={entry._id} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-display text-2xl font-extrabold">{totalTasks}</div>
                <div className="text-[10px] text-gray-500">total</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {dist.byStatus.map((s, i) => (
              <div key={s._id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-400 capitalize">
                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  {s._id}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${totalTasks > 0 ? (s.count/totalTasks*100) : 0}%`, background: PIE_COLORS[i] }} />
                  </div>
                  <span className="font-semibold text-white w-4 text-right">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Member performance */}
      <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
        <div className="font-display font-bold text-sm mb-1">Member Performance</div>
        <div className="text-xs text-gray-500 mb-5">Tasks completed by team member</div>
        <div className="space-y-3">
          {members.map((m, i) => {
            const rate = Math.round(m.completionRate || 0);
            return (
              <div key={m._id || i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  {m.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium truncate">{m.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{m.completed} done · {m.inProgress} active</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(rate, 100)}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-400 w-10 text-right flex-shrink-0">{rate}%</span>
              </div>
            );
          })}
          {members.length === 0 && <div className="text-center text-gray-600 text-sm py-6">No data yet — complete some tasks!</div>}
        </div>
      </div>
    </div>
  );
}
