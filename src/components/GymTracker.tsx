import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, X, Dumbbell, Check } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { WorkoutSession, Set } from '../types';
import { generateId } from '../store';

const EXERCISE_TEMPLATES = [
  'Bench Press','Squat','Deadlift','Overhead Press','Barbell Row',
  'Pull-up','Dip','Incline Press','Leg Press','Romanian Deadlift',
  'Bicep Curl','Tricep Extension','Lateral Raise','Face Pull','Cable Row',
  'Hip Thrust','Lunges','Plank','Push-up','Custom',
];

interface Props {
  sessions: WorkoutSession[];
  setSessions: (s: WorkoutSession[] | ((prev: WorkoutSession[]) => WorkoutSession[])) => void;
}

const inp: React.CSSProperties = {
  background: 'var(--bg-layer2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  padding: '5px 8px', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', width: '100%', textAlign: 'center',
};
const tab = (active: boolean): React.CSSProperties => ({
  padding: '5px 14px', fontSize: '12px', fontWeight: active ? 600 : 400, cursor: 'pointer',
  background: active ? 'var(--accent)' : 'var(--bg-layer1)', color: active ? '#fff' : 'var(--text-secondary)',
  border: 'none',
});

export default function GymTracker({ sessions, setSessions }: Props) {
  const [view, setView] = useState<'log' | 'history' | 'progress'>('log');
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [selectedExercise, setSelectedExercise] = useState('Bench Press');
  const [customName, setCustomName] = useState('');
  const [progressExercise, setProgressExercise] = useState('Bench Press');

  const startSession = () => setCurrentSession({
    id: generateId(), date: format(new Date(), 'yyyy-MM-dd'),
    name: `Workout — ${format(new Date(), 'MMM d')}`, exercises: [], notes: '',
  });

  const addExercise = () => {
    if (!currentSession) return;
    const name = selectedExercise === 'Custom' ? customName.trim() : selectedExercise;
    if (!name) return;
    setCurrentSession(s => s ? { ...s, exercises: [...s.exercises, { name, sets: [{ reps: 0, weight: 0, completed: false }] }] } : s);
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
    setCurrentSession(s => {
      if (!s) return s;
      const exs = [...s.exercises];
      const sets = exs[exIdx].sets.filter((_, i) => i !== setIdx);
      if (sets.length === 0) exs.splice(exIdx, 1); else exs[exIdx] = { ...exs[exIdx], sets };
      return { ...s, exercises: exs };
    });
  };
  const finishSession = () => {
    if (!currentSession) return;
    setSessions(prev => [currentSession, ...prev]);
    setCurrentSession(null);
  };

  const allNames = [...new Set(sessions.flatMap(s => s.exercises.map(e => e.name)))];
  const progressData = sessions
    .filter(s => s.exercises.some(e => e.name === progressExercise))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => {
      const ex = s.exercises.find(e => e.name === progressExercise)!;
      const done = ex.sets.filter(s => s.completed);
      return {
        date: format(parseISO(s.date), 'MMM d'),
        maxWeight: Math.max(...done.map(s => s.weight ?? 0), 0),
        totalVolume: done.reduce((a, s) => a + s.reps * (s.weight ?? 1), 0),
      };
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Tab bar */}
      <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {(['log', 'history', 'progress'] as const).map(v => (
          <button key={v} style={tab(view === v)} onClick={() => setView(v)}>
            {v === 'log' ? '🏋️  Log Workout' : v === 'history' ? '📋  History' : '📈  Progress'}
          </button>
        ))}
      </div>

      {/* Log view */}
      {view === 'log' && (
        !currentSession ? (
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-layer1)', padding: '64px', textAlign: 'center' }}>
            <Dumbbell size={36} style={{ color: 'var(--text-disabled)', margin: '0 auto 12px' }} />
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Ready to crush it?</div>
            <button onClick={startSession} style={{ padding: '8px 24px', fontSize: '13px', fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
              Start Workout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Session header */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={currentSession.name} onChange={e => setCurrentSession(s => s ? { ...s, name: e.target.value } : s)}
                style={{ flex: 1, background: 'var(--bg-layer1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '7px 12px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600, outline: 'none' }} />
              <button onClick={finishSession} style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 600, background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Check size={14} /> Finish
              </button>
            </div>

            {/* Exercise cards */}
            {currentSession.exercises.map((ex, exIdx) => (
              <div key={exIdx} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-layer1)', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-layer2)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>{ex.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{ex.sets.filter(s => s.completed).length}/{ex.sets.length} sets</span>
                </div>
                <div style={{ padding: '10px 14px' }}>
                  {/* Table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr 24px', gap: '6px', marginBottom: '6px' }}>
                    {['Set','Reps','Weight (kg)','Done',''].map(h => (
                      <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>{h}</div>
                    ))}
                  </div>
                  {ex.sets.map((set, setIdx) => (
                    <div key={setIdx} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr 24px', gap: '6px', marginBottom: '5px', alignItems: 'center', opacity: set.completed ? 0.6 : 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>{setIdx + 1}</div>
                      <input type="number" min="0" value={set.reps || ''} onChange={e => updateSet(exIdx, setIdx, 'reps', +e.target.value)} style={inp} />
                      <input type="number" min="0" step="0.5" value={set.weight || ''} onChange={e => updateSet(exIdx, setIdx, 'weight', +e.target.value)} style={inp} />
                      <button onClick={() => updateSet(exIdx, setIdx, 'completed', !set.completed)} style={{
                        padding: '5px', border: `1px solid ${set.completed ? 'var(--success)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)', background: set.completed ? 'var(--success)' : 'transparent',
                        color: set.completed ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      }}>{set.completed ? '✓' : '—'}</button>
                      <button onClick={() => removeSet(exIdx, setIdx)} style={{ background: 'transparent', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addSet(exIdx)} style={{
                    width: '100%', padding: '5px', marginTop: '4px', fontSize: '12px', cursor: 'pointer',
                    border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
                    background: 'transparent', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}>
                    <Plus size={12} /> Add Set
                  </button>
                </div>
              </div>
            ))}

            {/* Add exercise */}
            <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '12px', display: 'flex', gap: '8px' }}>
              <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} style={{ flex: 1, background: 'var(--bg-layer1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '5px 10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}>
                {EXERCISE_TEMPLATES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              {selectedExercise === 'Custom' && (
                <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Exercise name…"
                  style={{ flex: 1, background: 'var(--bg-layer1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '5px 10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
              )}
              <button onClick={addExercise} style={{ padding: '5px 14px', fontSize: '12px', fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={13} /> Add
              </button>
            </div>
          </div>
        )
      )}

      {/* History */}
      {view === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {sessions.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-disabled)', fontSize: '13px' }}>No workouts logged yet</div>
          )}
          {sessions.slice(0, 20).map((session, i) => {
            const totalSets = session.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
            const totalVolume = session.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).reduce((b, s) => b + s.reps * (s.weight ?? 1), 0), 0);
            return (
              <div key={session.id} style={{ padding: '12px 16px', background: 'var(--bg-layer1)', borderBottom: i < sessions.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{session.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{format(parseISO(session.date), 'EEEE, MMMM d yyyy')}</div>
                  </div>
                  <button onClick={() => setSessions(prev => prev.filter(s => s.id !== session.id))} style={{ background: 'transparent', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer', padding: '2px' }}>
                    <X size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>🏋️ {session.exercises.length} exercises</span>
                  <span>✅ {totalSets} sets</span>
                  <span>📊 {Math.round(totalVolume)} kg vol</span>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {session.exercises.map((ex, i) => {
                    const done = ex.sets.filter(s => s.completed);
                    return (
                      <span key={i} style={{ fontSize: '11px', padding: '2px 7px', background: 'var(--bg-layer2)', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--text-secondary)' }}>
                        {ex.name}{done.length > 0 && done[0].weight ? ` · ${done[0].weight}kg×${done[0].reps}` : done.length > 0 ? ` · ${done[0].reps}r` : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress */}
      {view === 'progress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Exercise</span>
            <select value={progressExercise} onChange={e => setProgressExercise(e.target.value)}
              style={{ background: 'var(--bg-layer1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '5px 10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}>
              {[...new Set([...EXERCISE_TEMPLATES.filter(e => e !== 'Custom'), ...allNames])].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          {progressData.length < 2 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-disabled)', fontSize: '13px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              Log at least 2 {progressExercise} sessions to see progress
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { key: 'maxWeight', label: 'Max Weight (kg)', color: 'var(--accent)' },
                { key: 'totalVolume', label: 'Total Volume', color: 'var(--success)' },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-layer1)', padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>{label}</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip contentStyle={{ background: 'var(--bg-layer2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '12px' }} />
                      <Line type="monotone" dataKey={key} stroke={color} strokeWidth={1.5} dot={{ fill: color, r: 3, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
