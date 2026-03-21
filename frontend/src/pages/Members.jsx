// src/pages/Members.jsx
import { useEffect, useState } from 'react';
import api from '../utils/api';

const AV_GRADIENTS = ['from-blue-500 to-indigo-600','from-violet-500 to-pink-600','from-amber-500 to-orange-600','from-emerald-500 to-teal-600','from-rose-500 to-red-600','from-cyan-500 to-blue-600'];
const STATUS_DOT = { online: 'bg-emerald-400', away: 'bg-amber-400', offline: 'bg-gray-600' };
const STATUS_LABEL = { online: { text: 'Online', bg: 'rgba(16,185,129,0.1)', color: '#10b981' }, away: { text: 'Away', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' }, offline: { text: 'Offline', bg: 'rgba(255,255,255,0.06)', color: '#4a5568' } };

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/members').then(r => setMembers(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-3 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white/[0.04] rounded-2xl" />)}
    </div>
  );

  const online = members.filter(m => m.status === 'online').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Team Members</h1>
          <p className="text-sm text-gray-500 mt-1">{members.length} members · <span className="text-emerald-400">{online} online</span></p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:-translate-y-px transition-all">
          + Invite Member
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {members.map((m, i) => {
          const grad = AV_GRADIENTS[i % AV_GRADIENTS.length];
          const st = STATUS_LABEL[m.status] || STATUS_LABEL.offline;
          return (
            <div key={m._id || i} className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-all relative overflow-hidden">
              {/* Top gradient */}
              <div className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-br ${grad} opacity-[0.07]`} />

              <div className="flex items-center gap-3 mb-4 relative">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-base font-bold font-display relative flex-shrink-0`}>
                  {m.initials || m.name?.slice(0,2).toUpperCase()}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${STATUS_DOT[m.status] || 'bg-gray-600'} rounded-full border-2 border-[#111827]`} />
                </div>
                <div className="overflow-hidden">
                  <div className="font-display font-bold text-[14px] truncate">{m.name}</div>
                  <div className="text-[12px] text-gray-500 truncate">{m.jobTitle || m.workspaceRole}</div>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: st.bg, color: st.color }}>
                    {st.text}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Active', value: m.tasks || 0, color: '#3b82f6' },
                  { label: 'Done', value: m.completed || 0, color: '#10b981' },
                  { label: 'Projects', value: m.projects || 0, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 text-center">
                    <div className="font-display font-bold text-base" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <button className="w-full py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all">
                💬 Message
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
