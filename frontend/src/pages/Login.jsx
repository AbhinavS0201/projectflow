// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', workspaceName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.workspaceName);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080c14] px-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="orb w-[500px] h-[500px] bg-violet-600 -top-40 -left-40" />
      <div className="orb w-[400px] h-[400px] bg-blue-600 -bottom-20 -right-20" style={{ animationDelay: '-10s' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-2xl mb-4 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
            ⟢
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">ProjectFlow</h1>
          <p className="text-gray-500 text-sm mt-2">Real-time collaborative project management</p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
          {/* Tab switcher */}
          <div className="flex bg-white/[0.04] rounded-xl p-1 mb-7 border border-white/[0.06]">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-300'}`}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input name="name" value={form.name} onChange={handle} required
                    placeholder="Alex Kim"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Workspace Name</label>
                  <input name="workspaceName" value={form.workspaceName} onChange={handle}
                    placeholder="Acme Corp"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-all" />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <input name="email" type="email" value={form.email} onChange={handle} required
                placeholder="you@company.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} required
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all" />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_6px_28px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-5 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-2">Demo credentials</p>
              <p className="text-xs text-gray-500">Email: <span className="text-blue-400">alex@projectflow.dev</span></p>
              <p className="text-xs text-gray-500">Password: <span className="text-blue-400">password123</span></p>
              <p className="text-xs text-gray-600 mt-1.5">Run <code className="text-violet-400">npm run seed</code> in backend first</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
