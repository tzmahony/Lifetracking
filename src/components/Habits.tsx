import { useState } from 'react';
import { format, subDays, parseISO, isSameDay, eachDayOfInterval } from 'date-fns';
import { Plus, X, Flame } from 'lucide-react';
import type { Habit } from '../types';
import { generateId } from '../store';

const COLORS = ['#2680eb','#e34850','#e68619','#2d9d78','#8e51c2','#d4380d','#0d7377','#c41d7f'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

interface Props {
  habits: Habit[];
  setHabits: (h: Habit[] | ((prev: Habit[]) => Habit[])) => void;
}

export default function Habits({ habits, setHabits }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', color: COLORS[0], targetDays: [1,2,3,4,5] as number[] });
  const today = new Date();

  const addHabit = () => {
    if (!form.name.trim()) return;
    setHabits(prev => [...prev, { id: generateId(), name: form.name.trim(), color: form.color, targetDays: form.targetDays, completions: [], createdAt: new Date().toISOString() }]);
    setForm({ name: '', color: COLORS[0], targetDays: [1,2,3,4,5] });
    setShowForm(false);
  };

  const toggleDay = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const done = h.completions.includes(dateStr);
      return { ...h, completions: done ? h.completions.filter(d => d !== dateStr) : [...h.completions, dateStr] };
    }));
  };

  const isComplete = (h: Habit, d: Date) => h.completions.includes(format(d, 'yyyy-MM-dd'));

  const streak = (habit: Habit) => {
    let count = 0;
    let d = today;
    for (let i = 0; i < 366; i++) {
      const dow = d.getDay();
      if (habit.targetDays.includes(dow)) {
        if (!habit.completions.includes(format(d, 'yyyy-MM-dd'))) break;
        count++;
      }
      d = subDays(d, 1);
    }
    return count;
  };

  const last7 = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  const last90 = eachDayOfInterval({ start: subDays(today, 89), end: today });

  const inp: React.CSSProperties = { background: 'var(--bg-layer2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 10px', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', width: '100%' };
  const lbl: React.CSSProperties = { fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Habit Tracker</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{format(today, 'EEEE, MMMM d')}</div>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Plus size={13} /> New Habit
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ border: '1px solid var(--border-focus)', borderRadius: 'var(--radius)', background: 'var(--bg-layer1)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addHabit()} style={inp} placeholder="Habit name (e.g. Morning run, Read 30 min)" />
          <div>
            <label style={lbl}>Target Days</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {DAYS.map((day, i) => (
                <button key={day} onClick={() => setForm(f => ({ ...f, targetDays: f.targetDays.includes(i) ? f.targetDays.filter(d => d !== i) : [...f.targetDays, i] }))} style={{
                  padding: '4px 9px', fontSize: '11px', cursor: 'pointer', borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)', fontWeight: form.targetDays.includes(i) ? 600 : 400,
                  background: form.targetDays.includes(i) ? 'var(--accent)' : 'var(--bg-layer2)',
                  color: form.targetDays.includes(i) ? '#fff' : 'var(--text-secondary)',
                }}>{day}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Color</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: c, cursor: 'pointer',
                  border: form.color === c ? '2px solid #fff' : '2px solid transparent',
                  outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: '1px',
                  transform: form.color === c ? 'scale(1.25)' : 'scale(1)', transition: 'transform 0.1s',
                }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={addHabit} style={{ flex: 1, padding: '6px', fontSize: '13px', fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer' }}>Add Habit</button>
            <button onClick={() => setShowForm(false)} style={{ padding: '6px 14px', fontSize: '13px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Column headers */}
      {habits.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 36px) 48px 20px', gap: '4px', alignItems: 'center', padding: '0 2px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Habit</span>
          {last7.map(d => (
            <div key={d.toISOString()} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: isSameDay(d, today) ? 'var(--accent)' : 'var(--text-tertiary)', textTransform: 'uppercase' }}>{format(d, 'EEE')}</div>
              <div style={{ fontSize: '11px', color: isSameDay(d, today) ? 'var(--accent)' : 'var(--text-secondary)' }}>{format(d, 'd')}</div>
            </div>
          ))}
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.06em' }}>Streak</div>
          <span />
        </div>
      )}

      {habits.length === 0 && (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-disabled)', fontSize: '13px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          Build your first habit above
        </div>
      )}

      {/* Habit rows */}
      {habits.map(habit => {
        const s = streak(habit);
        return (
          <div key={habit.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-layer1)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 36px) 48px 20px', gap: '4px', alignItems: 'center', padding: '10px 12px' }}>
              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: habit.color, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.name}</span>
              </div>
              {/* Day buttons */}
              {last7.map(d => {
                const isTarget = habit.targetDays.includes(d.getDay());
                const done = isComplete(habit, d);
                return (
                  <button key={d.toISOString()} onClick={() => isTarget && toggleDay(habit.id, d)} style={{
                    width: '32px', height: '32px', borderRadius: 'var(--radius)', border: `1px solid ${done ? habit.color : isTarget ? 'var(--border)' : 'var(--border-subtle)'}`,
                    background: done ? habit.color + '33' : 'transparent',
                    cursor: isTarget ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', margin: '0 auto',
                  }}>
                    {done ? <span style={{ color: habit.color, fontWeight: 700, fontSize: '13px' }}>✓</span> : isTarget ? <span style={{ color: 'var(--border)', fontSize: '16px', lineHeight: 1 }}>·</span> : null}
                  </button>
                );
              })}
              {/* Streak */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                {s > 0 && <Flame size={12} style={{ color: 'var(--warning)', flexShrink: 0 }} />}
                <span style={{ fontSize: '13px', fontWeight: 600, color: s > 0 ? 'var(--warning)' : 'var(--text-disabled)' }}>{s}</span>
              </div>
              {/* Delete */}
              <button onClick={() => setHabits(prev => prev.filter(h => h.id !== habit.id))} style={{ background: 'transparent', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                <X size={12} />
              </button>
            </div>

            {/* 90-day heatmap */}
            <div style={{ padding: '0 12px 10px', display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
              {last90.map(d => {
                const isTarget = habit.targetDays.includes(d.getDay());
                const done = isComplete(habit, d);
                return (
                  <div key={d.toISOString()} title={format(d, 'MMM d')} style={{
                    width: '9px', height: '9px', borderRadius: '1px',
                    background: done ? habit.color + 'bb' : isTarget ? 'var(--bg-layer2)' : 'transparent',
                    border: isTarget ? `1px solid var(--border-subtle)` : 'none',
                  }} />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
