// src/pages/KanbanBoard.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, useDroppable, useDraggable,
} from '@dnd-kit/core';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';

const COLUMNS = [
  { id: 'todo',       label: 'To Do',       color: '#4a5568' },
  { id: 'inprogress', label: 'In Progress',  color: '#3b82f6' },
  { id: 'review',     label: 'Review',       color: '#f59e0b' },
  { id: 'done',       label: 'Done',         color: '#10b981' },
];

const PRIORITY_COLORS = { critical: '#f43f5e', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };
const PRIORITY_BG     = { critical: 'rgba(244,63,94,0.12)', high: 'rgba(245,158,11,0.12)', medium: 'rgba(59,130,246,0.12)', low: 'rgba(16,185,129,0.12)' };
const AV_GRADIENTS    = ['from-blue-500 to-indigo-600', 'from-violet-500 to-pink-600', 'from-amber-500 to-orange-600', 'from-emerald-500 to-teal-600', 'from-rose-500 to-red-600'];

export default function KanbanBoard() {
  const { projectId } = useParams();
  const { socket, emitTaskMove, joinProject } = useSocket();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(projectId || '');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(async (pid) => {
    setLoading(true);
    try {
      const params = pid ? `?projectId=${pid}` : '';
      const [tRes, pRes] = await Promise.all([
        api.get(`/tasks${params}`),
        api.get('/projects'),
      ]);
      setTasks(tRes.data.data || []);
      setProjects(pRes.data.data || []);
      if (pid) {
        const proj = pRes.data.data.find(p => p._id === pid);
        setProject(proj);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(selectedProject); }, [selectedProject, load]);

  // Real-time task updates via Socket.io
  useEffect(() => {
    if (!socket || !selectedProject) return;
    joinProject(selectedProject);

    const onMoved = ({ taskId, newStatus }) => {
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    };
    const onCreated = (task) => {
      setTasks(prev => [task, ...prev]);
    };
    const onUpdated = (task) => {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t));
    };
    const onDeleted = ({ taskId }) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
    };

    socket.on('task:moved', onMoved);
    socket.on('task:created', onCreated);
    socket.on('task:updated', onUpdated);
    socket.on('task:deleted', onDeleted);

    return () => {
      socket.off('task:moved', onMoved);
      socket.off('task:created', onCreated);
      socket.off('task:updated', onUpdated);
      socket.off('task:deleted', onDeleted);
    };
  }, [socket, selectedProject, joinProject]);

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find(t => t._id === active.id));
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const task = tasks.find(t => t._id === active.id);
    if (!task || task.status === over.id) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t._id === active.id ? { ...t, status: over.id } : t));

    try {
      await api.patch(`/tasks/${active.id}/status`, { status: over.id });
      // Also emit via socket for other users
      emitTaskMove(active.id, over.id, selectedProject);
    } catch {
      // Rollback
      setTasks(prev => prev.map(t => t._id === active.id ? { ...t, status: task.status } : t));
    }
  };

  if (loading) return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(col => (
        <div key={col.id} className="min-w-[280px] w-[280px]">
          <div className="h-12 bg-white/[0.04] rounded-2xl mb-3 animate-pulse" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/[0.04] rounded-xl animate-pulse" />)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-extrabold">{project?.name || 'All Tasks'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tasks.length} tasks total</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/40 transition-all">
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
            {['Board', 'List'].map(v => (
              <button key={v} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${v === 'Board' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-500 hover:text-gray-300'}`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} collisionDetection={closestCorners}
        onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[580px]">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <Column key={col.id} col={col} tasks={colTasks} />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ col, tasks }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div className="min-w-[290px] w-[290px] flex flex-col flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#111827] border border-white/[0.06] rounded-t-2xl border-b-0">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
        <span className="font-display text-sm font-bold flex-1">{col.label}</span>
        <span className="bg-white/[0.08] text-gray-400 text-[11px] font-bold px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>

      {/* Drop zone */}
      <div ref={setNodeRef}
        className={`flex-1 bg-[#0d1220]/60 border border-white/[0.06] border-t-0 rounded-b-2xl p-2.5 flex flex-col gap-2.5 min-h-[500px] transition-all ${isOver ? 'drop-active' : ''}`}>
        {tasks.map(task => <TaskCard key={task._id} task={task} />)}
        <button className="w-full mt-1 py-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-600 border border-dashed border-white/[0.08] rounded-xl hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/[0.04] transition-all">
          <span>+</span> Add task
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, isDragging: dragging } = useDraggable({ id: task._id });

  const style = transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined;
  const color = PRIORITY_COLORS[task.priority] || '#3b82f6';

  const mergedStyle = { ...(style || {}), borderLeft: `3px solid ${color}` };

  return (
    <div ref={setNodeRef} style={mergedStyle} {...listeners} {...attributes}
      className={`bg-[#111827] border border-white/[0.07] rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-all hover:border-white/[0.14] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] select-none ${dragging || isDragging ? 'task-card-dragging' : ''}`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-[13px] font-semibold leading-snug flex-1">{task.title}</div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide flex-shrink-0"
          style={{ background: PRIORITY_BG[task.priority], color }}>
          {task.priority}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2 mb-2.5">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.06] text-gray-400 border border-white/[0.06]">{tag}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-gray-600">
          {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>}
          <span>💬 {task.comments?.length || 0}</span>
        </div>
        <div className="flex -space-x-1.5">
          {(task.assignees || []).slice(0, 3).map((a, i) => (
            <div key={a._id || i}
              className={`w-5 h-5 rounded-full border-2 border-[#111827] flex items-center justify-center text-[8px] font-bold bg-gradient-to-br ${AV_GRADIENTS[i % AV_GRADIENTS.length]}`}>
              {a.initials || (typeof a === 'string' ? a.slice(0, 2) : '?')}
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      {task.progress > 0 && (
        <div className="mt-2.5 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${task.progress}%`, background: color }} />
        </div>
      )}
    </div>
  );
}
