// src/pages/Projects.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const STATUS_STYLE = {
  active:   { bg: 'rgba(16,185,129,0.1)',  text: '#10b981' },
  planning: { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6' },
  review:   { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
  done:     { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6' },
  archived: { bg: 'rgba(255,255,255,0.05)', text: '#4a5568' },
};

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-3 gap-5 animate-pulse">
      {[...Array(6)].map((_, i) => <div key={i} className="h-56 bg-white/[0.04] rounded-2xl" />)}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} projects across your workspace</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {projects.map(p => {
          const st = STATUS_STYLE[p.status] || STATUS_STYLE.planning;
          return (
            <div key={p._id} onClick={() => navigate(`/board/${p._id}`)}
              className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.3)] hover:border-white/[0.12] transition-all relative overflow-hidden group">
              {/* Color glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(circle at top right, ${p.color}12, transparent 60%)` }} />

              <div className="flex items-start justify-between mb-3 relative">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: `${p.color}18` }}>{p.icon}</div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
                  style={{ background: st.bg, color: st.text }}>{p.status}</span>
              </div>

              <div className="font-display font-bold text-[15px] mb-1.5 relative">{p.name}</div>
              <div className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4 relative">{p.description}</div>

              {/* Progress */}
              <div className="mb-3 relative">
                <div className="flex justify-between text-[11px] text-gray-600 mb-1.5">
                  <span>Progress</span>
                  <span className="font-semibold text-white">{p.progress}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: p.color }} />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between relative">
                <div className="flex -space-x-2">
                  {(p.members || []).slice(0, 4).map((m, i) => (
                    <div key={m.user?._id || i}
                      className="w-6 h-6 rounded-full border-2 border-[#111827] bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[9px] font-bold">
                      {m.user?.initials || '?'}
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-gray-500">
                  {p.dueDate ? `Due ${new Date(p.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}` : '—'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
