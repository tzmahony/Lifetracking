import { useState } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { Plus, X, ChevronDown, ChevronUp, Dumbbell, TrendingUp, Check, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { WorkoutSession, Exercise, Set } from '../types';
import { generateId } from '../store';

const EXERCISE_TEMPLATES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
  'Pull-up', 'Dip', 'Incline Press', 'Leg Press', 'Romanian Deadlift',
  'Bicep Curl', 'Tricep Extension', 'Lateral Raise', 'Face Pull', 'Cable Row',
  'Hip Thrust', 'Lunges', 'Plank', 'Push-up', 'Custom',
];

interface Props {
  sessions: WorkoutSession[];
  setSessions: (s: WorkoutSession[] | ((prev: WorkoutSession[]) => WorkoutSession[])) => void;
}

export default function GymTracker({ sessions, setSessions }: Props) {
  const [view, setView] = useState<'log' | 'history' | 'progress'>('log');
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [selectedExercise, setSelectedExercise] = useState('Bench Press');
  const [customName, setCustomName] = useState('');
  const [progressExercise, setProgressExercise] = useState('Bench Press');

  const startSession = () => {
    setCurrentSession({
      id: generateId(),
      date: format(new Date(), 'yyyy-MM-dd'),
      name: `Workout — ${format(new Date(), 'MMM d')}`,
      exercises: [],
      notes: '',
    });
  };

  const addExercise = () => {
    if (!currentSession) return;
    const name = selectedExercise === 'Custom' ? customName.trim() : selectedExercise;
    if (!name) return;
    const ex: Exercise = { name, sets: [{ reps: 0, weight: 0, completed: false }] };
    setCurrentSession(s => s ? { ...s, exercises: [...s.exercises, ex] } : s);
  };

  const addSet = (exIdx: number) => {
    if (!currentSession) return;
    setCurrentSession(s => {
      if (!s) return s;
      const exs = [...s.exercises];
      const prev = exs[exIdx].sets.at(-1);
      exs[exIdx] = { ...exs[exIdx], sets: [...exs[exIdx].sets, { reps: prev?.reps ?? 0, weight: prev?.weight ?? 0, completed: false }] };
      return { ...s, exercises: exs };
    });
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof Set, value: number | boolean) => {
    if (!currentSession) return;
    setCurrentSession(s => {
      if (!s) return s;
      const exs = [...s.exercises];
      const sets = [...exs[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      exs[exIdx] = { ...exs[exIdx], sets };
      return { ...s, exercises: exs };
    });
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    if (!currentSession) return;
    setCurrentSession(s => {
      if (!s) return s;
      const exs = [...s.exercises];
      const sets = exs[exIdx].sets.filter((_, i) => i !== setIdx);
      if (sets.length === 0) {
        exs.splice(exIdx, 1);
      } else {
        exs[exIdx] = { ...exs[exIdx], sets };
      }
      return { ...s, exercises: exs };
    });
  };

  const finishSession = () => {
    if (!currentSession) return;
    setSessions(prev => [currentSession, ...prev]);
    setCurrentSession(null);
  };

  // Progress data for a given exercise
  const progressData = sessions
    .filter(s => s.exercises.some(e => e.name === progressExercise))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => {
      const ex = s.exercises.find(e => e.name === progressExercise)!;
      const completedSets = ex.sets.filter(s => s.completed);
      const maxWeight = Math.max(...completedSets.map(s => s.weight ?? 0), 0);
      const totalVolume = completedSets.reduce((acc, s) => acc + (s.reps * (s.weight ?? 1)), 0);
      return { date: format(parseISO(s.date), 'MMM d'), maxWeight, totalVolume, sets: completedSets.length };
    });

  const allExerciseNames = [...new Set(sessions.flatMap(s => s.exercises.map(e => e.name)))];
  const recentSessions = sessions.slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      {/* View tabs */}
      <div className="flex gap-2">
        {(['log', 'history', 'progress'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${view === v ? 'bg-indigo-500' : 'bg-white/5 hover:bg-white/10'}`}>
            {v === 'log' ? '🏋️ Log Workout' : v === 'history' ? '📋 History' : '📈 Progress'}
          </button>
        ))}
      </div>

      {/* Log view */}
      {view === 'log' && (
        <div className="space-y-4">
          {!currentSession ? (
            <div className="text-center py-16">
              <Dumbbell size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-6">Ready to crush it?</p>
              <button onClick={startSession}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-2xl font-medium transition-colors">
                Start Workout
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input value={currentSession.name} onChange={e => setCurrentSession(s => s ? { ...s, name: e.target.value } : s)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-semibold text-lg outline-none focus:border-indigo-500" />
                <button onClick={finishSession}
                  className="px-4 py-2.5 bg-green-500 hover:bg-green-600 rounded-xl font-medium transition-colors flex items-center gap-2">
                  <Check size={16} /> Finish
                </button>
              </div>

              {/* Exercises */}
              {currentSession.exercises.map((ex, exIdx) => (
                <div key={exIdx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-indigo-300">{ex.name}</h3>
                    <span className="text-xs text-gray-500">{ex.sets.filter(s => s.completed).length}/{ex.sets.length} sets</span>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 text-xs text-gray-400 px-1">
                      <span>Set</span><span>Reps</span><span>Weight (kg)</span><span>Done</span><span></span>
                    </div>
                    {ex.sets.map((set, setIdx) => (
                      <div key={setIdx} className={`grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 items-center ${set.completed ? 'opacity-70' : ''}`}>
                        <span className="text-sm text-gray-500 text-center">{setIdx + 1}</span>
                        <input type="number" min="0" value={set.reps || ''}
                          onChange={e => updateSet(exIdx, setIdx, 'reps', +e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-center text-sm outline-none focus:border-indigo-500" />
                        <input type="number" min="0" step="0.5" value={set.weight || ''}
                          onChange={e => updateSet(exIdx, setIdx, 'weight', +e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-center text-sm outline-none focus:border-indigo-500" />
                        <button onClick={() => updateSet(exIdx, setIdx, 'completed', !set.completed)}
                          className={`py-1.5 rounded-lg text-sm font-medium transition-colors ${set.completed ? 'bg-green-500 text-white' : 'bg-white/10 hover:bg-green-500/30'}`}>
                          {set.completed ? '✓' : '—'}
                        </button>
                        <button onClick={() => removeSet(exIdx, setIdx)} className="text-gray-600 hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addSet(exIdx)}
                    className="w-full py-1.5 border border-dashed border-white/10 rounded-xl text-sm text-gray-500 hover:border-indigo-500 hover:text-indigo-400 transition-colors flex items-center justify-center gap-2">
                    <Plus size={14} /> Add Set
                  </button>
                </div>
              ))}

              {/* Add exercise */}
              <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex gap-2">
                  <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none">
                    {EXERCISE_TEMPLATES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <button onClick={addExercise}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                    <Plus size={14} /> Add
                  </button>
                </div>
                {selectedExercise === 'Custom' && (
                  <input value={customName} onChange={e => setCustomName(e.target.value)}
                    placeholder="Exercise name..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History view */}
      {view === 'history' && (
        <div className="space-y-3">
          {sessions.length === 0 && (
            <div className="text-center py-16 text-gray-500">No workouts logged yet</div>
          )}
          {recentSessions.map(session => {
            const totalSets = session.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
            const totalVolume = session.exercises.reduce((a, e) =>
              a + e.sets.filter(s => s.completed).reduce((b, s) => b + (s.reps * (s.weight ?? 1)), 0), 0);
            return (
              <div key={session.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{session.name}</h3>
                    <div className="text-sm text-gray-400">{format(parseISO(session.date), 'EEEE, MMMM d yyyy')}</div>
                  </div>
                  <button onClick={() => setSessions(prev => prev.filter(s => s.id !== session.id))}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="flex gap-4 text-sm text-gray-400 mb-3">
                  <span>🏋️ {session.exercises.length} exercises</span>
                  <span>✅ {totalSets} sets</span>
                  <span>📊 {Math.round(totalVolume)} kg volume</span>
                </div>
                <div className="space-y-1">
                  {session.exercises.map((ex, i) => {
                    const done = ex.sets.filter(s => s.completed);
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-300 w-36 truncate">{ex.name}</span>
                        <span className="text-gray-500">{done.length} sets</span>
                        {done.length > 0 && (
                          <span className="text-indigo-400 text-xs">
                            {done[0].weight ? `${done.map(s => `${s.reps}×${s.weight}kg`).join(', ')}` : `${done.map(s => `${s.reps} reps`).join(', ')}`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress view */}
      {view === 'progress' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">Exercise:</label>
            <select value={progressExercise} onChange={e => setProgressExercise(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none">
              {[...new Set([...EXERCISE_TEMPLATES.filter(e => e !== 'Custom'), ...allExerciseNames])].map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {progressData.length < 2 ? (
            <div className="text-center py-16 text-gray-500">
              Log at least 2 {progressExercise} sessions to see progress
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Max Weight (kg)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="maxWeight" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Total Volume (reps × weight)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="totalVolume" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
