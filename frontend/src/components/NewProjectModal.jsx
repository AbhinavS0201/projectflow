// src/components/NewProjectModal.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal, { Field, inputCls, primaryBtn, ghostBtn } from './Modal';
import api from '../utils/api';

const ICONS = ['🚀', '💡', '🎯', '⚡', '🔥', '🌟', '🛸', '🎨', '🧩', '⚙️'];
const COLORS = [
  { label: 'Blue', value: '#3b82f6' }, { label: 'Violet', value: '#8b5cf6' },
  { label: 'Amber', value: '#f59e0b' }, { label: 'Emerald', value: '#10b981' },
  { label: 'Rose', value: '#f43f5e' }, { label: 'Cyan', value: '#06b6d4' },
];

export default function NewProjectModal({ onClose }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', icon: '🚀', color: '#3b82f6', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/projects', form);
      onClose();
      navigate(`/board/${data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create New Project" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Project Name *">
          <input name="name" value={form.name} onChange={handle} required
            placeholder="Give your project a name" className={inputCls} autoFocus />
        </Field>
        <Field label="Description">
          <textarea name="description" value={form.description} onChange={handle}
            placeholder="What's this project about?" rows={2} className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Icon">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all border ${form.icon === ic ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07]'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Color">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, color: c.value }))}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ background: c.value }} title={c.label} />
              ))}
            </div>
          </Field>
        </div>

        <Field label="Due Date">
          <input type="date" name="dueDate" value={form.dueDate} onChange={handle}
            className={inputCls} style={{ colorScheme: 'dark' }} />
        </Field>

        {error && <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? 'Creating…' : 'Create Project →'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
