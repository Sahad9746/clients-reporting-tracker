import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Entry } from '../types';
import { toast } from 'react-hot-toast';

interface TrackerContextType {
  entries: Entry[];
  addEntry: (entry: Omit<Entry, 'id' | 'lastUpdated'>) => void;
  deleteEntry: (id: string) => void;
  updateEntry: (id: string, updated: Partial<Entry>) => void;
  isLoading: boolean;
  syncError: string | null;
  refresh: () => Promise<void>;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>(() => {
    const saved = localStorage.getItem('client-tracker-entries');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const syncUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL || '';

  const fetchEntries = useCallback(async () => {
    if (!syncUrl) return;
    setIsLoading(true);
    setSyncError(null);
    try {
      const res = await fetch(syncUrl);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch(e) {
        throw new Error("Received HTML instead of JSON. The deployment is likely requiring a Google Login. Check 'Who has access'.");
      }
      
      if (data.status === 'success' && data.entries) {
        setEntries(data.entries);
        localStorage.setItem('client-tracker-entries', JSON.stringify(data.entries));
        setSyncError(null);
      } else if (data.status === 'error') {
        throw new Error(data.message || "Unknown Apps Script error");
      }
    } catch (err: any) {
      console.error("Failed to fetch from Google Sheets:", err);
      setSyncError(err.message || "Failed to connect to Google Sheets.");
    } finally {
      setIsLoading(false);
    }
  }, [syncUrl]);

  // Fetch on mount
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Helper to send individual actions to Google Sheets
  const sendActionToSheet = async (payload: any) => {
    if (!syncUrl) return;
    try {
      const res = await fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (data.status === 'error') throw new Error(data.message);
      setSyncError(null);
    } catch (err: any) {
      console.error("Failed to post to Google Sheets:", err);
      setSyncError(err.message || "Failed to update Google Sheets.");
      toast.error("Failed to sync change to Google Sheets!");
    }
  };

  const addEntry = (entryData: Omit<Entry, 'id' | 'lastUpdated'>) => {
    const newEntry: Entry = {
      ...entryData,
      id: Math.random().toString(36).substring(2, 9),
      lastUpdated: new Date().toISOString()
    };
    
    // Optimistic UI update
    const newEntries = [newEntry, ...entries];
    setEntries(newEntries);
    localStorage.setItem('client-tracker-entries', JSON.stringify(newEntries));

    // Background Sync
    sendActionToSheet({ action: 'add', entry: newEntry });
  };

  const deleteEntry = (id: string) => {
    // Optimistic UI update
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    localStorage.setItem('client-tracker-entries', JSON.stringify(newEntries));

    // Background Sync
    sendActionToSheet({ action: 'delete', id });
  };

  const updateEntry = (id: string, updated: Partial<Entry>) => {
    let updatedEntry: Entry | undefined;
    
    // Optimistic UI update
    const newEntries = entries.map(e => {
      if (e.id === id) {
        updatedEntry = { ...e, ...updated, lastUpdated: new Date().toISOString() };
        return updatedEntry;
      }
      return e;
    });
    
    setEntries(newEntries);
    localStorage.setItem('client-tracker-entries', JSON.stringify(newEntries));

    // Background Sync
    if (updatedEntry) {
      sendActionToSheet({ action: 'update', entry: updatedEntry });
    }
  };

  return (
    <TrackerContext.Provider value={{ entries, addEntry, deleteEntry, updateEntry, isLoading, syncError, refresh: fetchEntries }}>
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) throw new Error('useTracker must be used within TrackerProvider');
  return context;
};
