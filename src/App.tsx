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
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-[#0f0f1a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm">L</div>
          <span className="font-bold text-lg tracking-tight">LifeOS</span>
          <span className="text-sm text-gray-500 hidden sm:block">{format(new Date(), 'EEEE, MMMM d')}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {todayEvents.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
              <CalendarDays size={12} />
              {todayEvents.length} today
            </div>
          )}
          {activeTasks > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
              <CheckSquare size={12} />
              {activeTasks} tasks
            </div>
          )}
          {todayHabits.total > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
              <Flame size={12} />
              {todayHabits.done}/{todayHabits.total} habits
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-16 sm:w-56 flex-shrink-0 border-r border-white/5 py-4 flex flex-col gap-1 px-2">
          {NAV.map(({ id, label, Icon }) => {
            const active = section === id;
            return (
              <button key={id} onClick={() => setSection(id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full
                  ${active ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
                <Icon size={18} />
                <span className="hidden sm:block">{label}</span>
              </button>
            );
          })}
        </nav>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto">
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
