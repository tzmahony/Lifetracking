import { useState } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameDay, isSameMonth, isToday,
  parseISO, addWeeks, subWeeks, startOfWeek as startOfWk,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Clock } from 'lucide-react';
import type { CalendarEvent } from '../types';
import { generateId } from '../store';

const EVENT_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444',
];

interface Props {
  events: CalendarEvent[];
  setEvents: (e: CalendarEvent[] | ((prev: CalendarEvent[]) => CalendarEvent[])) => void;
}

type View = 'month' | 'week';

export default function Calendar({ events, setEvents }: Props) {
  const [current, setCurrent] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({ title: '', startTime: '', endTime: '', color: EVENT_COLORS[0], description: '' });
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  const prev = () => view === 'month' ? setCurrent(subMonths(current, 1)) : setCurrent(subWeeks(current, 1));
  const next = () => view === 'month' ? setCurrent(addMonths(current, 1)) : setCurrent(addWeeks(current, 1));

  const openNew = (date: Date) => {
    setSelectedDate(date);
    setEditing(null);
    setForm({ title: '', startTime: '', endTime: '', color: EVENT_COLORS[0], description: '' });
    setShowForm(true);
  };

  const openEdit = (e: CalendarEvent, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setEditing(e);
    setSelectedDate(parseISO(e.date));
    setForm({ title: e.title, startTime: e.startTime || '', endTime: e.endTime || '', color: e.color, description: e.description || '' });
    setShowForm(true);
  };

  const save = () => {
    if (!form.title.trim() || !selectedDate) return;
    if (editing) {
      setEvents(prev => prev.map(e => e.id === editing.id
        ? { ...e, ...form, date: format(selectedDate, 'yyyy-MM-dd') } : e));
    } else {
      setEvents(prev => [...prev, {
        id: generateId(),
        date: format(selectedDate, 'yyyy-MM-dd'),
        ...form,
      }]);
    }
    setShowForm(false);
  };

  const deleteEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));

  const eventsOn = (d: Date) => events.filter(e => isSameDay(parseISO(e.date), d));

  // Month grid
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) { days.push(d); d = addDays(d, 1); }

  // Week view
  const weekStart = startOfWk(current, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-bold min-w-[160px] text-center">
            {view === 'month' ? format(current, 'MMMM yyyy') : `Week of ${format(weekStart, 'MMM d, yyyy')}`}
          </h2>
          <button onClick={next} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrent(new Date())} className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors">Today</button>
          {(['month', 'week'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${view === v ? 'bg-indigo-500' : 'bg-white/10 hover:bg-white/20'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="bg-[#1a1a2e] p-2 text-center text-xs font-semibold text-gray-400">{d}</div>
            ))}
            {days.map(day => {
              const evs = eventsOn(day);
              const faded = !isSameMonth(day, current);
              return (
                <div key={day.toISOString()}
                  onClick={() => openNew(day)}
                  className={`bg-[#1a1a2e] min-h-[90px] p-2 cursor-pointer hover:bg-white/5 transition-colors group ${faded ? 'opacity-30' : ''}`}>
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday(day) ? 'bg-indigo-500 text-white' : 'text-gray-300 group-hover:bg-white/10'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1">
                    {evs.slice(0, 3).map(e => (
                      <div key={e.id} onClick={ev => openEdit(e, ev)}
                        className="text-xs px-2 py-0.5 rounded-md truncate cursor-pointer hover:brightness-110"
                        style={{ backgroundColor: e.color + '33', color: e.color, borderLeft: `3px solid ${e.color}` }}>
                        {e.startTime && <span className="opacity-70 mr-1">{e.startTime}</span>}
                        {e.title}
                      </div>
                    ))}
                    {evs.length > 3 && <div className="text-xs text-gray-500">+{evs.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => {
              const evs = eventsOn(day);
              return (
                <div key={day.toISOString()} className="flex flex-col gap-1">
                  <div className={`text-center p-2 rounded-xl ${isToday(day) ? 'bg-indigo-500' : 'bg-white/5'}`}>
                    <div className="text-xs text-gray-400">{format(day, 'EEE')}</div>
                    <div className="text-lg font-bold">{format(day, 'd')}</div>
                  </div>
                  <div className="space-y-1 cursor-pointer" onClick={() => openNew(day)}>
                    {evs.map(e => (
                      <div key={e.id} onClick={ev => openEdit(e, ev)}
                        className="p-2 rounded-lg text-sm hover:brightness-110 transition-all"
                        style={{ backgroundColor: e.color + '22', borderLeft: `3px solid ${e.color}` }}>
                        <div className="font-medium" style={{ color: e.color }}>{e.title}</div>
                        {e.startTime && (
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {e.startTime}{e.endTime ? ` – ${e.endTime}` : ''}
                          </div>
                        )}
                      </div>
                    ))}
                    {evs.length === 0 && (
                      <div className="h-16 border border-dashed border-white/10 rounded-lg flex items-center justify-center">
                        <Plus size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editing ? 'Edit Event' : `New Event — ${selectedDate ? format(selectedDate, 'MMM d') : ''}`}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Event title" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Start time</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">End time</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description (optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" />
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#1a1a2e]' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              {editing && (
                <button onClick={() => { deleteEvent(editing.id); setShowForm(false); }}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors">Delete</button>
              )}
              <button onClick={save} className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-medium transition-colors">
                {editing ? 'Save Changes' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
