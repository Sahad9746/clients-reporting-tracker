import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Client, ContentTask, CalendarStatus } from '../types';
import { IQUE_CAP_TASKS } from '../data/iqueCapCalendar';
import { toast } from 'react-hot-toast';
import { sanityClient } from '../lib/sanity';

// ── Context types ──────────────────────────────────────────────────────────
interface ClientsContextType {
  clients: Client[];
  taskMap: Record<string, ContentTask[]>;
  isLoading: boolean;
  addClient: (data: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, updates: Partial<Omit<Client, 'id' | 'isDefault' | 'createdAt'>>) => void;
  deleteClient: (id: string) => void;
  addTask: (clientId: string, task: Omit<ContentTask, 'id'>) => void;
  updateTask: (clientId: string, taskId: string, updates: Partial<Omit<ContentTask, 'id'>>) => void;
  updateTaskStatus: (clientId: string, taskId: string, status: CalendarStatus) => void;
  deleteTask: (clientId: string, taskId: string) => void;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────
export const ClientsProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [taskMap, setTaskMap] = useState<Record<string, ContentTask[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Initial load & migration
  useEffect(() => {
    async function init() {
      if (!import.meta.env.VITE_SANITY_PROJECT_ID) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Fetch all clients
        const sanityClients = await sanityClient.fetch(`*[_type == "client"]{
          "id": _id,
          name, color, pilotLabel, password, googleSheetUrl, isDefault, createdAt
        }`);

        let finalClients: Client[] = sanityClients;

        // MIGRATION: If no clients in Sanity, migrate from localStorage
        if (sanityClients.length === 0 && !localStorage.getItem('sanity-migrated')) {
          console.log('Running one-time Sanity migration...');
          const localClients = JSON.parse(localStorage.getItem('adm-clients') || '[]');
          
          if (localClients.length > 0) {
            for (const c of localClients) {
              const doc = await sanityClient.create({
                _type: 'client',
                name: c.name,
                color: c.color,
                pilotLabel: c.pilotLabel,
                password: c.password,
                isDefault: c.isDefault,
              });
              
              c._newId = doc._id; // Store temp id for task linking

              // Migrate tasks for this client
              const localTasks = JSON.parse(localStorage.getItem(`cal-tasks-${c.id}`) || '[]');
              if (c.id === 'ique-cap' && localTasks.length === 0) {
                 // It's the default client but they had no local tasks saved yet, meaning they were viewing the hardcoded seed.
                 localTasks.push(...IQUE_CAP_TASKS);
              }
              
              for (const t of localTasks) {
                await sanityClient.create({
                  _type: 'contentTask',
                  clientRef: { _type: 'reference', _ref: doc._id },
                  title: t.title,
                  channel: t.channel,
                  week: t.week,
                  scheduledDate: t.scheduledDate,
                  description: t.description,
                  approvalNote: t.approvalNote,
                  status: t.status,
                  deliverableCount: t.deliverableCount,
                });
              }
            }
            localStorage.setItem('sanity-migrated', 'true');
            // Re-fetch after migration
            finalClients = await sanityClient.fetch(`*[_type == "client"]{
              "id": _id,
              name, color, pilotLabel, password, googleSheetUrl, isDefault, createdAt
            }`);
          }
        }

        setClients(finalClients);

        // Fetch tasks
        const sanityTasks = await sanityClient.fetch(`*[_type == "contentTask"]{
          "id": _id,
          "clientId": clientRef._ref,
          title, channel, week, scheduledDate, description, approvalNote, status, deliverableCount
        }`);

        const newMap: Record<string, ContentTask[]> = {};
        for (const t of sanityTasks) {
          if (!newMap[t.clientId]) newMap[t.clientId] = [];
          newMap[t.clientId].push(t);
        }
        setTaskMap(newMap);

      } catch (e) {
        console.error("Sanity load error:", e);
        toast.error("Failed to load data from Sanity");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // ── Client CRUD ────────────────────────────────────────────────────────
  const addClient = async (data: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      const doc = await sanityClient.create({
        _type: 'client',
        name: data.name,
        color: data.color,
        pilotLabel: data.pilotLabel,
        password: data.password,
        googleSheetUrl: data.googleSheetUrl,
        isDefault: false,
      });
      const newClient: Client = { ...data, id: doc._id, createdAt: doc._createdAt, isDefault: false };
      setClients(prev => [...prev, newClient]);
      setTaskMap(prev => ({ ...prev, [doc._id]: [] }));
      toast.success(`Client "${data.name}" added`);
    } catch (e) {
      toast.error('Failed to add client');
    }
  };

  const updateClient = async (id: string, updates: Partial<Omit<Client, 'id' | 'isDefault' | 'createdAt'>>) => {
    try {
      await sanityClient.patch(id).set(updates).commit();
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast.success('Client updated');
    } catch (e) {
      toast.error('Failed to update client');
    }
  };

  const deleteClient = async (id: string) => {
    if (clients.find(c => c.id === id)?.isDefault) {
      toast.error('Cannot delete the default client');
      return;
    }
    try {
      // Delete tasks first
      const tasks = taskMap[id] || [];
      for (const t of tasks) await sanityClient.delete(t.id);
      
      // Delete client
      await sanityClient.delete(id);
      
      setClients(prev => prev.filter(c => c.id !== id));
      setTaskMap(prev => { const next = { ...prev }; delete next[id]; return next; });
      toast.success('Client removed');
    } catch (e) {
      toast.error('Failed to delete client');
    }
  };

  // ── Task CRUD ──────────────────────────────────────────────────────────
  const addTask = async (clientId: string, taskData: Omit<ContentTask, 'id'>) => {
    try {
      const doc = await sanityClient.create({
        _type: 'contentTask',
        clientRef: { _type: 'reference', _ref: clientId },
        ...taskData,
      });
      const newTask: ContentTask = { ...taskData, id: doc._id };
      setTaskMap(prev => ({
        ...prev,
        [clientId]: [...(prev[clientId] ?? []), newTask],
      }));
      toast.success('Task added');
    } catch (e) {
      toast.error('Failed to add task');
    }
  };

  const updateTask = async (clientId: string, taskId: string, updates: Partial<Omit<ContentTask, 'id'>>) => {
    try {
      await sanityClient.patch(taskId).set(updates).commit();
      setTaskMap(prev => ({
        ...prev,
        [clientId]: (prev[clientId] ?? []).map(t => t.id === taskId ? { ...t, ...updates } : t)
      }));
      toast.success('Task updated');
    } catch (e) {
      toast.error('Failed to update task');
    }
  };

  const updateTaskStatus = async (clientId: string, taskId: string, status: CalendarStatus) => {
    try {
      await sanityClient.patch(taskId).set({ status }).commit();
      setTaskMap(prev => ({
        ...prev,
        [clientId]: (prev[clientId] ?? []).map(t => t.id === taskId ? { ...t, status } : t)
      }));
      toast.success('Status updated');
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const deleteTask = async (clientId: string, taskId: string) => {
    try {
      await sanityClient.delete(taskId);
      setTaskMap(prev => ({
        ...prev,
        [clientId]: (prev[clientId] ?? []).filter(t => t.id !== taskId)
      }));
      toast.success('Task removed');
    } catch (e) {
      toast.error('Failed to delete task');
    }
  };

  return (
    <ClientsContext.Provider value={{ clients, taskMap, isLoading, addClient, updateClient, deleteClient, addTask, updateTask, updateTaskStatus, deleteTask }}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error('useClients must be used within ClientsProvider');
  return ctx;
};
