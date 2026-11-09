export interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date string
  tags: string[];
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  startTime?: string;
  endTime?: string;
  color: string;
  description?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
}

export interface Exercise {
  name: string;
  sets: Set[];
  notes?: string;
}

export interface Set {
  reps: number;
  weight?: number; // kg
  duration?: number; // seconds (for timed exercises)
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  date: string;
  name: string;
  exercises: Exercise[];
  durationMinutes?: number;
  notes?: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  targetDays: number[]; // 0=Sun, 1=Mon...6=Sat
  completions: string[]; // ISO date strings
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
  pinned: boolean;
}

export type AppSection = 'calendar' | 'tasks' | 'gym' | 'habits' | 'notes';
