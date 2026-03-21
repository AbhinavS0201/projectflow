// src/components/NewTaskModal.jsx
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function NewTaskModal({ onClose, defaultProjectId }) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', status: 'todo',
    tags: '', dueDate: '', projectId: defaultProjectId || '',
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.data || [])).catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.projectId) return setError('Please select a project');
    setLoading(true); setError('');
    try {
      await api.post('/tasks', {
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: form.status,
        project: form.projectId,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || undefined,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return <Modal title="Create New Task" onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      <Field label="Title *">
        <input name="title" value={form.title} onChange={handle} required
          placeholder="What needs to be done?" className={inputCls} autoFocus />
      </Field>
      <Field label="Description">
        <textarea name="description" value={form.description} onChange={handle}
          placeholder="Add context or details…" rows={3} className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Project *">
          <select name="projectId" value={form.projectId} onChange={handle} required className={inputCls}>
            <option value="">Select project…</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select name="status" value={form.status} onChange={handle} className={inputCls}>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </Field>
        <Field label="Priority">
          <select name="priority" value={form.priority} onChange={handle} className={inputCls}>
            <option value="low">🟢 Low</option>
            <option value="medium">🔵 Medium</option>
            <option value="high">🟡 High</option>
            <option value="critical">🔴 Critical</option>
          </select>
        </Field>
        <Field label="Due Date">
          <input type="date" name="dueDate" value={form.dueDate} onChange={handle}
            className={inputCls} style={{ colorScheme: 'dark' }} />
        </Field>
      </div>
      <Field label="Tags (comma separated)">
        <input name="tags" value={form.tags} onChange={handle}
          placeholder="frontend, api, design…" className={inputCls} />
      </Field>
      {error && <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? 'Creating…' : 'Create Task'}
        </button>
      </div>
    </form>
  </Modal>;
}
