import { useState } from 'react';
import { CalendarDays, CheckSquare, Dumbbell, Flame, FileText } from 'lucide-react';
import Calendar from './components/Calendar';
import Tasks from './components/Tasks';
import GymTracker from './components/GymTracker';
import Habits from './components/Habits';
import Notes from './components/Notes';
import { useLocalStorage } from './store';
import type { CalendarEvent, Task, WorkoutSession, Habit, Note, AppSection } from './types';
import { format } from 'date-fns';

const NAV: { id: AppSection; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { id: 'tasks', label: 'Tasks', Icon: CheckSquare },
  { id: 'gym', label: 'Gym', Icon: Dumbbell },
  { id: 'habits', label: 'Habits', Icon: Flame },
  { id: 'notes', label: 'Notes', Icon: FileText },
];

export default function App() {
  const [section, setSection] = useState<AppSection>('calendar');
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('lifeos-events', []);
  const [tasks, setTasks] = useLocalStorage<Task[]>('lifeos-tasks', []);
  const [sessions, setSessions] = useLocalStorage<WorkoutSession[]>('lifeos-sessions', []);
  const [habits, setHabits] = useLocalStorage<Habit[]>('lifeos-habits', []);
  const [notes, setNotes] = useLocalStorage<Note[]>('lifeos-notes', []);

  const todayEvents = events.filter(e => e.date === format(new Date(), 'yyyy-MM-dd'));
  const activeTasks = tasks.filter(t => !t.done).length;
  const todayHabits = {
    done: habits.filter(h => h.completions.includes(format(new Date(), 'yyyy-MM-dd'))).length,
    total: habits.filter(h => h.targetDays.includes(new Date().getDay())).length,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Adobe-style top bar */}
      <header style={{ background: 'var(--bg-layer1)', borderBottom: '1px solid var(--border)' }}
        className="px-4 h-11 flex items-center justify-between flex-shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Adobe-style product icon */}
          <div className="w-6 h-6 flex items-center justify-center rounded"
            style={{ background: 'var(--accent)', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Lo
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>LifeOS</span>
          <span style={{ width: '1px', height: '16px', background: 'var(--border)', display: 'inline-block', margin: '0 4px' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{format(new Date(), 'EEEE, MMMM d')}</span>
        </div>
        <div className="flex items-center gap-3" style={{ fontSize: '12px' }}>
          {todayEvents.length > 0 && (
            <span style={{ color: 'var(--text-secondary)' }} className="hidden sm:flex items-center gap-1">
              <CalendarDays size={11} /> {todayEvents.length} event{todayEvents.length !== 1 ? 's' : ''}
            </span>
          )}
          {activeTasks > 0 && (
            <span style={{ color: 'var(--text-secondary)' }} className="hidden sm:flex items-center gap-1">
              <CheckSquare size={11} /> {activeTasks} task{activeTasks !== 1 ? 's' : ''}
            </span>
          )}
          {todayHabits.total > 0 && (
            <span style={{ color: 'var(--text-secondary)' }} className="hidden sm:flex items-center gap-1">
              <Flame size={11} /> {todayHabits.done}/{todayHabits.total} habits
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Adobe-style left rail */}
        <nav className="flex-shrink-0 flex flex-col py-2"
          style={{ width: '200px', borderRight: '1px solid var(--border)', background: 'var(--bg-layer1)' }}>
          <div style={{ padding: '4px 8px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Workspace
          </div>
          {NAV.map(({ id, label, Icon }) => {
            const active = section === id;
            return (
              <button key={id} onClick={() => setSection(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 10px 7px 12px',
                  fontSize: '13px', fontWeight: active ? 600 : 400,
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  background: active ? 'var(--accent-subtle)' : 'transparent',
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  borderRadius: 0, width: '100%', textAlign: 'left', cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--bg-layer2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; } }}>
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
            {section === 'calendar' && <Calendar events={events} setEvents={setEvents} />}
            {section === 'tasks' && <Tasks tasks={tasks} setTasks={setTasks} />}
            {section === 'gym' && <GymTracker sessions={sessions} setSessions={setSessions} />}
            {section === 'habits' && <Habits habits={habits} setHabits={setHabits} />}
            {section === 'notes' && <Notes notes={notes} setNotes={setNotes} />}
          </div>
        </main>
      </div>
    </div>
  );
}
