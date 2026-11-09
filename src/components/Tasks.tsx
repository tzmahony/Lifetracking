import { useState } from 'react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { Plus, X, Check, ChevronDown, ChevronUp, Tag, Calendar, Flag } from 'lucide-react';
import type { Task } from '../types';
import { generateId } from '../store';

const PRIORITY_STYLES = {
  high: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  low: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
};

interface Props {
  tasks: Task[];
  setTasks: (t: Task[] | ((prev: Task[]) => Task[])) => void;
}

export default function Tasks({ tasks, setTasks }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', priority: 'medium' as Task['priority'], dueDate: '', tags: '' });
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('active');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'created'>('priority');
  const [tagInput, setTagInput] = useState('');

  const addTask = () => {
    if (!form.title.trim()) return;
    setTasks(prev => [...prev, {
      id: generateId(),
      title: form.title.trim(),
      done: false,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      createdAt: new Date().toISOString(),
    }]);
    setForm({ title: '', priority: 'medium', dueDate: '', tags: '' });
    setShowForm(false);
  };

  const toggle = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const filtered = tasks
    .filter(t => filter === 'all' ? true : filter === 'active' ? !t.done : t.done)
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      }
      if (sortBy === 'date') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.done).length,
    overdue: tasks.filter(t => !t.done && t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))).length,
  };

  const allTags = [...new Set(tasks.flatMap(t => t.tags))];

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-indigo-400' },
          { label: 'Done', value: stats.done, color: 'text-green-400' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-2xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(['active', 'done', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${filter === f ? 'bg-indigo-500' : 'hover:bg-white/10'}`}>
              {f}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm outline-none">
          <option value="priority">Sort: Priority</option>
          <option value="date">Sort: Due Date</option>
          <option value="created">Sort: Created</option>
        </select>
        <button onClick={() => setShowForm(!showForm)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Task title..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Flag size={10} /> Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Calendar size={10} /> Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Tag size={10} /> Tags</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="work, personal..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addTask} className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-medium transition-colors">Add Task</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {allTags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-400 cursor-pointer hover:bg-white/10 transition-colors">#{tag}</span>
          ))}
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            {filter === 'active' ? 'No active tasks — add one above!' : 'Nothing here yet'}
          </div>
        )}
        {filtered.map(task => {
          const overdue = !task.done && task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
          const dueToday = !task.done && task.dueDate && isToday(parseISO(task.dueDate));
          const p = PRIORITY_STYLES[task.priority];
          return (
            <div key={task.id}
              className={`flex items-start gap-3 p-4 bg-white/5 rounded-2xl border transition-all group ${overdue ? 'border-red-500/30' : 'border-white/5 hover:border-white/10'} ${task.done ? 'opacity-50' : ''}`}>
              <button onClick={() => toggle(task.id)}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                  ${task.done ? 'bg-green-500 border-green-500' : 'border-white/30 hover:border-indigo-400'}`}>
                {task.done && <Check size={12} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${task.done ? 'line-through text-gray-500' : ''}`}>{task.title}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.bg} ${p.text}`}>{task.priority}</span>
                  {task.dueDate && (
                    <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-400' : dueToday ? 'text-amber-400' : 'text-gray-500'}`}>
                      <Calendar size={10} />
                      {overdue ? 'Overdue · ' : dueToday ? 'Due today · ' : ''}{format(parseISO(task.dueDate), 'MMM d')}
                    </span>
                  )}
                  {task.tags.map(tag => (
                    <span key={tag} className="text-xs text-gray-500">#{tag}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => remove(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all">
                <X size={14} className="text-red-400" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
