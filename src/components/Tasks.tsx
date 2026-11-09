import { useState } from 'react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { Plus, X, Check, Tag, Calendar, Flag } from 'lucide-react';
import type { Task } from '../types';
import { generateId } from '../store';

const PRIORITY_COLORS = {
  high:   { dot: 'var(--error)',   text: 'var(--error)',   bg: 'rgba(227,72,80,0.12)' },
  medium: { dot: 'var(--warning)', text: 'var(--warning)', bg: 'rgba(230,134,25,0.12)' },
  low:    { dot: 'var(--success)', text: 'var(--success)', bg: 'rgba(45,157,120,0.12)' },
};

const inp: React.CSSProperties = {
  background: 'var(--bg-layer2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  padding: '6px 10px', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', width: '100%',
};
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' };
const lbl: React.CSSProperties = {
  fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', display: 'block',
  textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
};

interface Props {
  tasks: Task[];
  setTasks: (t: Task[] | ((prev: Task[]) => Task[])) => void;
}

export default function Tasks({ tasks, setTasks }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', priority: 'medium' as Task['priority'], dueDate: '', tags: '' });
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('active');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'created'>('priority');

  const addTask = () => {
    if (!form.title.trim()) return;
    setTasks(prev => [...prev, {
      id: generateId(), title: form.title.trim(), done: false,
      priority: form.priority, dueDate: form.dueDate || undefined,
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
      if (sortBy === 'priority') return ({ high: 0, medium: 1, low: 2 }[a.priority]) - ({ high: 0, medium: 1, low: 2 }[b.priority]);
      if (sortBy === 'date') { if (!a.dueDate) return 1; if (!b.dueDate) return -1; return a.dueDate.localeCompare(b.dueDate); }
      return b.createdAt.localeCompare(a.createdAt);
    });

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.done).length,
    overdue: tasks.filter(t => !t.done && t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))).length,
  };
  const allTags = [...new Set(tasks.flatMap(t => t.tags))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--border)' }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--accent)' },
          { label: 'Completed', value: stats.done, color: 'var(--success)' },
          { label: 'Overdue', value: stats.overdue, color: stats.overdue > 0 ? 'var(--error)' : 'var(--text-tertiary)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-layer1)', padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 300, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {(['active', 'done', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: filter === f ? 600 : 400,
              background: filter === f ? 'var(--accent)' : 'var(--bg-layer1)',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
              border: 'none', textTransform: 'capitalize',
            }}>{f}</button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={{ ...sel, width: 'auto', padding: '5px 10px', fontSize: '12px' }}>
          <option value="priority">Sort: Priority</option>
          <option value="date">Sort: Due Date</option>
          <option value="created">Sort: Created</option>
        </select>
        {allTags.length > 0 && allTags.map(tag => (
          <span key={tag} style={{ fontSize: '11px', padding: '3px 8px', border: '1px solid var(--border)', borderRadius: '99px', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
            #{tag}
          </span>
        ))}
        <button onClick={() => setShowForm(!showForm)} style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)',
        }}>
          <Plus size={13} /> New Task
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ border: '1px solid var(--border-focus)', borderRadius: 'var(--radius)', background: 'var(--bg-layer1)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addTask()} style={inp} placeholder="Task title…" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={lbl}><Flag size={9} style={{ display: 'inline', marginRight: 3 }} />Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))} style={sel}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label style={lbl}><Calendar size={9} style={{ display: 'inline', marginRight: 3 }} />Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}><Tag size={9} style={{ display: 'inline', marginRight: 3 }} />Tags</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={inp} placeholder="work, personal" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={addTask} style={{ flex: 1, padding: '6px', fontSize: '13px', fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer' }}>Add Task</button>
            <button onClick={() => setShowForm(false)} style={{ padding: '6px 14px', fontSize: '13px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-disabled)', fontSize: '13px' }}>
            {filter === 'active' ? 'No active tasks — add one above' : 'Nothing here yet'}
          </div>
        ) : filtered.map((task, i) => {
          const overdue = !task.done && task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
          const dueToday = !task.done && task.dueDate && isToday(parseISO(task.dueDate));
          const p = PRIORITY_COLORS[task.priority];
          return (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '10px 14px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              background: 'var(--bg-layer1)',
              opacity: task.done ? 0.5 : 1,
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-layer2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-layer1)'; }}>
              {/* Checkbox */}
              <button onClick={() => toggle(task.id)} style={{
                width: '16px', height: '16px', borderRadius: '3px', border: `1.5px solid ${task.done ? 'var(--success)' : 'var(--border)'}`,
                background: task.done ? 'var(--success)' : 'transparent', flexShrink: 0, marginTop: '1px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                {task.done && <Check size={10} color="#fff" />}
              </button>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>{task.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '2px', background: p.bg, color: p.text, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', color: overdue ? 'var(--error)' : dueToday ? 'var(--warning)' : 'var(--text-tertiary)' }}>
                      <Calendar size={10} />
                      {overdue ? 'Overdue · ' : dueToday ? 'Today · ' : ''}{format(parseISO(task.dueDate), 'MMM d')}
                    </span>
                  )}
                  {task.tags.map(tag => (
                    <span key={tag} style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>#{tag}</span>
                  ))}
                </div>
              </div>
              {/* Delete */}
              <button onClick={() => remove(task.id)} style={{ padding: '2px', cursor: 'pointer', color: 'var(--text-disabled)', background: 'transparent', border: 'none', opacity: 0, transition: 'opacity 0.1s' }}
                className="task-delete">
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`.task-delete:hover { opacity: 1 !important; color: var(--error) !important; }
        div:hover > .task-delete { opacity: 1 !important; }`}</style>
    </div>
  );
}
