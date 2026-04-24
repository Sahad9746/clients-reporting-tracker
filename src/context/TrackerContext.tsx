import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Entry } from '../types';

interface TrackerContextType {
  entries: Entry[];
  addEntry: (entry: Omit<Entry, 'id' | 'lastUpdated'>) => void;
  deleteEntry: (id: string) => void;
  updateEntry: (id: string, updated: Partial<Entry>) => void;
  syncUrl: string;
  setSyncUrl: (url: string) => void;
  isLoading: boolean;
  syncError: string | null;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider = ({ children }: { children: ReactNode }) => {
  const [syncUrl, setSyncUrl] = useState<string>(() => localStorage.getItem('client-tracker-sync-url') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>(() => {
    const saved = localStorage.getItem('client-tracker-entries');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: '1',
        date: new Date().toISOString().split('T')[0],
        taskType: 'Article',
        platform: 'Medium',
        url: 'https://medium.com',
        status: 'Live',
        indexed: 'Yes',
        engagement: 'Medium',
        notes: 'Initial publication',
        lastUpdated: new Date().toISOString()
      }
    ];
  });

  // Fetch from Google Sheets if URL is set
  useEffect(() => {
    if (syncUrl) {
      setIsLoading(true);
      setSyncError(null);
      fetch(syncUrl)
        .then(async res => {
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch(e) {
            console.error("Google Sheets HTML Response:", text);
            throw new Error("Received HTML instead of JSON. The deployment is likely requiring a Google Login. Check 'Who has access'.");
          }
        })
        .then(data => {
          if (data.status === 'success' && data.entries) {
            setEntries(data.entries);
            localStorage.setItem('client-tracker-entries', JSON.stringify(data.entries));
            setSyncError(null);
          } else if (data.status === 'error') {
            throw new Error(data.message || "Unknown Apps Script error");
          }
        })
        .catch(err => {
          console.error("Failed to fetch from Google Sheets:", err);
          setSyncError(err.message || "Failed to connect to Google Sheets.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [syncUrl]);

  // Sync to Google Sheets and localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('client-tracker-entries', JSON.stringify(entries));
    localStorage.setItem('client-tracker-sync-url', syncUrl);
    
    if (syncUrl && entries.length > 0) {
      // Background sync, no need to await or block UI
      fetch(syncUrl, {
        method: 'POST',
        // using text/plain to avoid CORS preflight issues with some Apps Script deployments
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'sync', entries })
      })
      .then(async res => {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data.status === 'error') throw new Error(data.message);
          setSyncError(null);
        } catch(e) {
          throw new Error("Post to sheet failed. Check deployment settings.");
        }
      })
      .catch(err => {
        console.error("Failed to post to Google Sheets:", err);
        setSyncError(err.message || "Failed to update Google Sheets.");
      });
    }
  }, [entries, syncUrl]);

  const addEntry = (entryData: Omit<Entry, 'id' | 'lastUpdated'>) => {
    const newEntry: Entry = {
      ...entryData,
      id: Math.random().toString(36).substring(2, 9),
      lastUpdated: new Date().toISOString()
    };
    setEntries(prev => [newEntry, ...prev]);
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updated: Partial<Entry>) => {
    setEntries(prev => prev.map(e => {
      if (e.id === id) {
        return { ...e, ...updated, lastUpdated: new Date().toISOString() };
      }
      return e;
    }));
  };

  return (
    <TrackerContext.Provider value={{ entries, addEntry, deleteEntry, updateEntry, syncUrl, setSyncUrl, isLoading, syncError }}>
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) throw new Error('useTracker must be used within TrackerProvider');
  return context;
};
