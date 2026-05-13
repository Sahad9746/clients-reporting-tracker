import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { ContentTask, CalendarStatus } from '../types';
import { IQUE_CAP_TASKS } from '../data/iqueCapCalendar';
import { toast } from 'react-hot-toast';

interface CalendarContextType {
  tasks: ContentTask[];
  addTask: (task: Omit<ContentTask, 'id'>) => void;
  updateTaskStatus: (id: string, status: CalendarStatus) => void;
  deleteTask: (id: string) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

const STORAGE_KEY = 'ique-cap-calendar-tasks';

function loadTasks(): ContentTask[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: ContentTask[] = JSON.parse(saved);
      // Merge saved statuses + any custom tasks on top of seed data
      const seedIds = new Set(IQUE_CAP_TASKS.map((t) => t.id));
      const customTasks = parsed.filter((t) => !seedIds.has(t.id));
      const statusMap = new Map(parsed.map((t) => [t.id, t.status]));
      const seedWithStatus = IQUE_CAP_TASKS.map((t) => ({
        ...t,
        status: statusMap.get(t.id) ?? t.status,
      }));
      return [...seedWithStatus, ...customTasks];
    }
  } catch {
    // ignore corrupt storage
  }
  return IQUE_CAP_TASKS;
}

function persist(tasks: ContentTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<ContentTask[]>(loadTasks);

  const addTask = (taskData: Omit<ContentTask, 'id'>) => {
    const newTask: ContentTask = {
      ...taskData,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setTasks((prev) => {
      const next = [...prev, newTask];
      persist(next);
      return next;
    });
    toast.success('Task added to calendar');
  };

  const updateTaskStatus = (id: string, status: CalendarStatus) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, status } : t));
      persist(next);
      return next;
    });
    toast.success('Status updated');
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      persist(next);
      return next;
    });
    toast.success('Task removed');
  };

  return (
    <CalendarContext.Provider value={{ tasks, addTask, updateTaskStatus, deleteTask }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar must be used within CalendarProvider');
  return ctx;
};
