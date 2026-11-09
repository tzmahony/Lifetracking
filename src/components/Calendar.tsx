import { useState } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameDay, isSameMonth, isToday,
  parseISO, addWeeks, subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Clock } from 'lucide-react';
import type { CalendarEvent } from '../types';
import { generateId } from '../store';

const EVENT_COLORS = ['#2680eb', '#e34850', '#e68619', '#2d9d78', '#8e51c2', '#d4380d', '#0d7377'];

const btn = (variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'ghost', extra = '') =>
  `inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all ${extra}` +
  (variant === 'primary'
    ? ' text-white font-medium'
    : variant === 'danger'
    ? ' font-medium'
    : '');

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
    setSelectedDate(date); setEditing(null);
    setForm({ title: '', startTime: '', endTime: '', color: EVENT_COLORS[0], description: '' });
    setShowForm(true);
  };
  const openEdit = (e: CalendarEvent, ev: React.MouseEvent) => {
    ev.stopPropagation(); setEditing(e); setSelectedDate(parseISO(e.date));
    setForm({ title: e.title, startTime: e.startTime || '', endTime: e.endTime || '', color: e.color, description: e.description || '' });
    setShowForm(true);
  };
  const save = () => {
    if (!form.title.trim() || !selectedDate) return;
    if (editing) {
      setEvents(prev => prev.map(e => e.id === editing.id ? { ...e, ...form, date: format(selectedDate, 'yyyy-MM-dd') } : e));
    } else {
      setEvents(prev => [...prev, { id: generateId(), date: format(selectedDate, 'yyyy-MM-dd'), ...form }]);
    }
    setShowForm(false);
  };
  const deleteEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));
  const eventsOn = (d: Date) => events.filter(e => isSameDay(parseISO(e.date), d));

  const monthStart = startOfMonth(current);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(current), { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = gridStart; while (d <= gridEnd) { days.push(d); d = addDays(d, 1); }

  const weekStart = startOfWeek(current, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const s = {
    toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' } as React.CSSProperties,
    iconBtn: { padding: '4px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-layer1)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' } as React.CSSProperties,
    pill: (active: boolean) => ({ padding: '3px 10px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: active ? 'var(--accent)' : 'var(--bg-layer1)', color: active ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: active ? 600 : 400 }) as React.CSSProperties,
    input: { width: '100%', background: 'var(--bg-layer2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 10px', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' } as React.CSSProperties,
    label: { fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px', display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 600 },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Toolbar */}
      <div style={s.toolbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button style={s.iconBtn} onClick={prev}><ChevronLeft size={14} /></button>
          <span style={{ fontSize: '15px', fontWeight: 600, minWidth: '170px', textAlign: 'center', color: 'var(--text-primary)' }}>
            {view === 'month' ? format(current, 'MMMM yyyy') : `Week of ${format(weekStart, 'MMM d')}`}
          </span>
          <button style={s.iconBtn} onClick={next}><ChevronRight size={14} /></button>
          <button style={{ ...s.iconBtn, padding: '3px 10px', fontSize: '12px', marginLeft: '4px' }} onClick={() => setCurrent(new Date())}>Today</button>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {(['month', 'week'] as View[]).map(v => (
            <button key={v} style={s.pill(view === v)} onClick={() => setView(v)}
              onMouseEnter={e => { if (view !== v) (e.currentTarget as HTMLElement).style.background = 'var(--bg-layer2)'; }}
              onMouseLeave={e => { if (view !== v) (e.currentTarget as HTMLElement).style.background = 'var(--bg-layer1)'; }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Month view */}
      {view === 'month' && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border)', background: 'var(--bg-layer1)' }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', borderRight: '1px solid var(--border-subtle)' }}>{d}</div>
            ))}
          </div>
          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {days.map((day, i) => {
              const evs = eventsOn(day);
              const faded = !isSameMonth(day, current);
              const today = isToday(day);
              return (
                <div key={day.toISOString()} onClick={() => openNew(day)} style={{
                  minHeight: '88px', padding: '6px', cursor: 'pointer',
                  background: faded ? 'var(--bg-base)' : 'var(--bg-layer1)',
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border-subtle)' : 'none',
                  borderBottom: i < days.length - 7 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-layer2)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = faded ? 'var(--bg-base)' : 'var(--bg-layer1)'; }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: today ? '50%' : 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: today ? 700 : 400,
                    color: today ? '#fff' : faded ? 'var(--text-disabled)' : 'var(--text-secondary)',
                    background: today ? 'var(--accent)' : 'transparent',
                  }}>{format(day, 'd')}</div>
                  <div style={{ marginTop: '3px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {evs.slice(0, 3).map(e => (
                      <div key={e.id} onClick={ev => openEdit(e, ev)} style={{
                        fontSize: '11px', padding: '1px 5px', borderRadius: '2px',
                        background: e.color + '22', color: e.color,
                        borderLeft: `2px solid ${e.color}`,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}>
                        {e.startTime && <span style={{ opacity: 0.7, marginRight: '3px' }}>{e.startTime}</span>}{e.title}
                      </div>
                    ))}
                    {evs.length > 3 && <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', paddingLeft: '5px' }}>+{evs.length - 3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week view */}
      {view === 'week' && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {weekDays.map((day, i) => {
              const evs = eventsOn(day);
              const today = isToday(day);
              return (
                <div key={day.toISOString()} style={{ borderRight: i < 6 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div style={{
                    padding: '10px', textAlign: 'center', borderBottom: '1px solid var(--border)',
                    background: today ? 'var(--accent-subtle)' : 'var(--bg-layer1)',
                  }}>
                    <div style={{ fontSize: '11px', color: today ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{format(day, 'EEE')}</div>
                    <div style={{ fontSize: '20px', fontWeight: 300, color: today ? 'var(--accent)' : 'var(--text-primary)' }}>{format(day, 'd')}</div>
                  </div>
                  <div style={{ padding: '6px', minHeight: '120px', background: 'var(--bg-layer1)', cursor: 'pointer' }}
                    onClick={() => openNew(day)}>
                    {evs.map(e => (
                      <div key={e.id} onClick={ev => openEdit(e, ev)} style={{
                        marginBottom: '3px', padding: '4px 6px', borderRadius: 'var(--radius-sm)',
                        borderLeft: `2px solid ${e.color}`, background: e.color + '18',
                        fontSize: '12px', color: e.color, cursor: 'pointer',
                      }}>
                        <div style={{ fontWeight: 600 }}>{e.title}</div>
                        {e.startTime && (
                          <div style={{ fontSize: '11px', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                            <Clock size={9} /> {e.startTime}{e.endTime ? `–${e.endTime}` : ''}
                          </div>
                        )}
                      </div>
                    ))}
                    {evs.length === 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: 'var(--text-disabled)' }}>
                        <Plus size={14} />
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: 'var(--bg-layer1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', width: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{editing ? 'Edit Event' : `New Event${selectedDate ? ' — ' + format(selectedDate, 'MMM d') : ''}`}</span>
              <button onClick={() => setShowForm(false)} style={{ padding: '3px', cursor: 'pointer', color: 'var(--text-secondary)', border: 'none', background: 'transparent' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={s.label}>Title</label>
                <input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && save()} style={s.input} placeholder="Event title" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={s.label}>Start</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>End</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={s.input} />
                </div>
              </div>
              <div>
                <label style={s.label}>Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={s.input} placeholder="Optional" />
              </div>
              <div>
                <label style={s.label}>Color</label>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {EVENT_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                      width: '20px', height: '20px', borderRadius: '50%', background: c, cursor: 'pointer',
                      border: form.color === c ? '2px solid #fff' : '2px solid transparent',
                      outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: '1px',
                      transform: form.color === c ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.1s',
                    }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              {editing && (
                <button onClick={() => { deleteEvent(editing.id); setShowForm(false); }}
                  style={{ padding: '6px 14px', fontSize: '13px', border: '1px solid var(--error)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--error)', cursor: 'pointer', fontWeight: 500 }}>
                  Delete
                </button>
              )}
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: '6px 14px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={save}
                style={{ flex: 2, padding: '6px 14px', fontSize: '13px', border: 'none', borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                {editing ? 'Save Changes' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
