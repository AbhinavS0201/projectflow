// src/components/AppShell.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import NewTaskModal from './NewTaskModal';
import NewProjectModal from './NewProjectModal';

const NAV = [
  { to: '/', icon: '⬡', label: 'Dashboard', exact: true },
  { to: '/projects', icon: '◈', label: 'Projects' },
  { to: '/board', icon: '⊞', label: 'Board' },
  { to: '/analytics', icon: '◉', label: 'Analytics' },
  { to: '/chat', icon: '◎', label: 'Chat', badge: 3 },
  { to: '/members', icon: '◌', label: 'Members' },
];

export default function AppShell({ children }) {
  const { user, workspace, logout } = useAuth();
  const { connected, onlineUsers } = useSocket();
  const navigate = useNavigate();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjModal, setShowProjModal] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="flex h-screen bg-[#080c14] overflow-hidden relative">
      {/* Ambient orbs */}
      <div className="orb w-[600px] h-[600px] bg-violet-700 -top-52 -left-52 z-0" />
      <div className="orb w-[500px] h-[500px] bg-blue-700 -bottom-32 -right-32 z-0" style={{ animationDelay: '-7s' }} />

      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="w-[260px] flex-shrink-0 flex flex-col bg-[#0d1220] border-r border-white/[0.06] z-10 relative">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-lg shadow-[0_0_20px_rgba(59,130,246,0.3)]">⟢</div>
            <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">ProjectFlow</span>
          </div>
        </div>

        {/* Workspace */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.05] transition-all">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {workspace?.name?.slice(0, 2).toUpperCase() || 'AC'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[13px] font-semibold truncate">{workspace?.name || 'My Workspace'}</div>
              <div className="text-[11px] text-gray-500 capitalize">{workspace?.plan || 'free'} plan</div>
            </div>
            <span className="text-gray-600 text-xs">⌄</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase px-2 pb-1 pt-2">Main</p>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13.5px] font-medium transition-all cursor-pointer border
                ${isActive
                  ? 'bg-blue-500/[0.12] border-blue-500/20 text-blue-300'
                  : 'text-gray-500 border-transparent hover:bg-white/[0.04] hover:text-gray-200'}`
              }>
              <span className="w-4 text-center text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          <p className="text-[10px] font-bold tracking-widest text-gray-600 uppercase px-2 pb-1 pt-4">Quick Actions</p>
          <button onClick={() => setShowProjModal(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13.5px] text-blue-400 border border-transparent hover:bg-blue-500/[0.08] hover:border-blue-500/20 transition-all">
            <span className="w-4 text-center">＋</span>
            <span>New Project</span>
          </button>
        </nav>

        {/* Online indicator */}
        <div className="px-4 py-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-[11px] text-gray-600">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-gray-600'}`}
              style={{ animation: connected ? 'pulse-dot 2s ease-in-out infinite' : 'none' }} />
            {connected ? `${(onlineUsers.length || 1)} online` : 'Connecting…'}
          </div>
        </div>

        {/* User */}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[12px] font-bold flex-shrink-0 relative">
              {initials}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0d1220]" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[13px] font-semibold truncate">{user?.name}</div>
              <div className="text-[11px] text-gray-500 truncate">{user?.jobTitle || user?.role}</div>
            </div>
            <button onClick={logout}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 text-xs transition-all px-1"
              title="Sign out">⇥</button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden z-[1]">
        {/* Topbar */}
        <header className="h-16 flex items-center px-6 gap-4 border-b border-white/[0.06] bg-[#080c14]/80 backdrop-blur-xl flex-shrink-0 z-[5]">
          {/* Search */}
          <div className="flex-1 max-w-sm">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3.5 py-2 focus-within:border-blue-500/40 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] transition-all">
              <span className="text-gray-600 text-sm">⌕</span>
              <input placeholder="Search tasks, projects…"
                className="bg-transparent outline-none text-sm text-white placeholder-gray-600 flex-1 min-w-0" />
              <kbd className="text-[10px] text-gray-700 bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifs(v => !v)}
                className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all relative">
                🔔
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-[#080c14]" />
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-11 w-80 bg-[#111827] border border-white/[0.1] rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-[fadeIn_0.15s_ease]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
                    <span className="font-display font-bold text-sm">Notifications</span>
                    <button className="text-xs text-blue-400 hover:text-blue-300">Mark all read</button>
                  </div>
                  {[
                    { icon: '🎯', text: 'Alex assigned you to "Socket.io sync"', time: '5m ago', unread: true },
                    { icon: '💬', text: 'Sophia mentioned you in #design', time: '20m ago', unread: true },
                    { icon: '✅', text: '"CI/CD pipeline" was marked Done', time: '1h ago', unread: false },
                    { icon: '🔔', text: '"JWT flow" is due tomorrow', time: '2h ago', unread: false },
                  ].map((n, i) => (
                    <div key={i} className={`flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer border-b border-white/[0.05] transition-all ${n.unread ? 'relative pl-7' : ''}`}>
                      {n.unread && <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                      <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-sm flex-shrink-0">{n.icon}</div>
                      <div>
                        <div className="text-xs text-gray-300 leading-relaxed">{n.text}</div>
                        <div className="text-[11px] text-gray-600 mt-0.5">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Task */}
            <button onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_24px_rgba(59,130,246,0.45)] hover:-translate-y-px transition-all">
              <span>+</span> New Task
            </button>
          </div>
        </header>

        {/* Live presence bar */}
        <div className="flex items-center gap-2 px-6 py-1.5 bg-emerald-500/[0.06] border-b border-emerald-500/[0.1] text-xs text-emerald-400 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <span>Live</span>
          <div className="flex -space-x-1.5 ml-1">
            {['AK', 'SR', 'MJ', 'PL'].map((u, i) => (
              <div key={i} className={`w-5 h-5 rounded-full border-2 border-[#080c14] flex items-center justify-center text-[8px] font-bold ${['bg-gradient-to-br from-blue-500 to-indigo-600', 'bg-gradient-to-br from-violet-500 to-pink-600', 'bg-gradient-to-br from-amber-500 to-orange-600', 'bg-gradient-to-br from-emerald-500 to-teal-600'][i]}`}>
                {u}
              </div>
            ))}
          </div>
          <span className="text-gray-600">4 members active</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-7 page-enter">
          {children}
        </main>
      </div>

      {/* Modals */}
      {showTaskModal && <NewTaskModal onClose={() => setShowTaskModal(false)} />}
      {showProjModal && <NewProjectModal onClose={() => setShowProjModal(false)} />}
    </div>
  );
}
