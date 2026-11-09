import { useState } from 'react';
import { format, subDays, parseISO, isSameDay, startOfWeek, addDays, eachDayOfInterval, subMonths } from 'date-fns';
import { Plus, X, Check, Flame } from 'lucide-react';
import type { Habit } from '../types';
import { generateId } from '../store';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  habits: Habit[];
  setHabits: (h: Habit[] | ((prev: Habit[]) => Habit[])) => void;
}

export default function Habits({ habits, setHabits }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', color: COLORS[0], targetDays: [1, 2, 3, 4, 5] as number[] });
  const today = new Date();

  const addHabit = () => {
    if (!form.name.trim()) return;
    setHabits(prev => [...prev, {
      id: generateId(),
      name: form.name.trim(),
      color: form.color,
      targetDays: form.targetDays,
      completions: [],
      createdAt: new Date().toISOString(),
    }]);
    setForm({ name: '', color: COLORS[0], targetDays: [1, 2, 3, 4, 5] });
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

  const isComplete = (habit: Habit, date: Date) => habit.completions.includes(format(date, 'yyyy-MM-dd'));

  const streak = (habit: Habit) => {
    let count = 0;
    let d = today;
    while (true) {
      const dayOfWeek = d.getDay();
      if (habit.targetDays.includes(dayOfWeek)) {
        if (!habit.completions.includes(format(d, 'yyyy-MM-dd'))) break;
        count++;
      }
      d = subDays(d, 1);
      if (count > 365) break;
    }
    return count;
  };

  // 7-day grid for each habit
  const last7 = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  // 90-day heatmap
  const last90 = eachDayOfInterval({ start: subDays(today, 89), end: today });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Habit Tracker</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> New Habit
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addHabit()}
            placeholder="Habit name (e.g. 'Morning run', 'Read 30 min')" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" />
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Target days</label>
            <div className="flex gap-2">
              {DAYS.map((day, i) => (
                <button key={day} onClick={() => setForm(f => ({
                  ...f, targetDays: f.targetDays.includes(i) ? f.targetDays.filter(d => d !== i) : [...f.targetDays, i]
                }))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.targetDays.includes(i) ? 'bg-indigo-500' : 'bg-white/5 hover:bg-white/10'}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#1a1a2e]' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addHabit} className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-medium transition-colors">Add Habit</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Day headers */}
      {habits.length > 0 && (
        <div className="grid grid-cols-[1fr_repeat(7,2.5rem)_3rem_1.5rem] gap-2 items-center px-1">
          <span className="text-xs text-gray-500">Habit</span>
          {last7.map(d => (
            <span key={d.toISOString()} className={`text-center text-xs font-medium ${isSameDay(d, today) ? 'text-indigo-400' : 'text-gray-500'}`}>
              <div>{format(d, 'EEE')}</div>
              <div>{format(d, 'd')}</div>
            </span>
          ))}
          <span className="text-xs text-gray-500 text-center">🔥</span>
          <span></span>
        </div>
      )}

      {habits.length === 0 && (
        <div className="text-center py-16 text-gray-500">Build your first habit above!</div>
      )}

      {habits.map(habit => {
        const s = streak(habit);
        return (
          <div key={habit.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 group">
            <div className="grid grid-cols-[1fr_repeat(7,2.5rem)_3rem_1.5rem] gap-2 items-center">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                <span className="text-sm font-medium truncate">{habit.name}</span>
              </div>
              {last7.map(d => {
                const isTarget = habit.targetDays.includes(d.getDay());
                const done = isComplete(habit, d);
                return (
                  <button key={d.toISOString()} onClick={() => isTarget && toggleDay(habit.id, d)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all mx-auto
                      ${!isTarget ? 'opacity-20 cursor-default bg-white/5' :
                        done ? 'scale-105 shadow-lg' : 'bg-white/5 hover:bg-white/10'}`}
                    style={done ? { backgroundColor: habit.color + '33', border: `2px solid ${habit.color}` } : {}}>
                    {done ? <Check size={14} style={{ color: habit.color }} /> : isTarget ? <span className="text-gray-600">·</span> : null}
                  </button>
                );
              })}
              <div className="flex items-center justify-center gap-1">
                {s > 0 && <Flame size={14} className="text-amber-400" />}
                <span className={`text-sm font-bold ${s > 0 ? 'text-amber-400' : 'text-gray-600'}`}>{s}</span>
              </div>
              <button onClick={() => setHabits(prev => prev.filter(h => h.id !== habit.id))}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all mx-auto">
                <X size={12} className="text-red-400" />
              </button>
            </div>

            {/* 90-day heatmap */}
            <div className="mt-3 flex flex-wrap gap-0.5">
              {last90.map(d => {
                const isTarget = habit.targetDays.includes(d.getDay());
                const done = isComplete(habit, d);
                return (
                  <div key={d.toISOString()} title={format(d, 'MMM d')}
                    className={`w-2.5 h-2.5 rounded-sm transition-all ${!isTarget ? 'bg-white/5' : done ? '' : 'bg-white/10'}`}
                    style={done ? { backgroundColor: habit.color + '99' } : {}} />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
