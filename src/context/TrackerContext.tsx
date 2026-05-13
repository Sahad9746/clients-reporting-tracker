import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Entry } from '../types';
import { toast } from 'react-hot-toast';
import { sanityClient } from '../lib/sanity';

interface TrackerContextType {
  entries: Entry[];
  addEntry: (entry: Omit<Entry, 'id' | 'lastUpdated'>, customUrl?: string) => void;
  deleteEntry: (id: string, customUrl?: string) => void;
  updateEntry: (id: string, updated: Partial<Entry>, customUrl?: string) => void;
  isLoading: boolean;
  syncError: string | null;
  refresh: () => Promise<void>;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);

  const syncUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL || '';

  const fetchEntries = useCallback(async () => {
    if (!import.meta.env.VITE_SANITY_PROJECT_ID) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setSyncError(null);
    try {
      const sanityEntries = await sanityClient.fetch(`*[_type == "trackerEntry"] | order(date desc){
        "id": _id,
        "lastUpdated": _updatedAt,
        "clientId": clientRef._ref,
        date, taskType, platform, url, status, indexed, engagement, notes
      }`);

      let finalEntries = sanityEntries;

      // MIGRATION: If Sanity has no entries, check localStorage
      if (sanityEntries.length === 0 && !localStorage.getItem('sanity-tracker-migrated')) {
        const local = JSON.parse(localStorage.getItem('client-tracker-entries') || '[]');
        if (local.length > 0) {
          for (const e of local) {
            await sanityClient.create({
              _type: 'trackerEntry',
              date: e.date,
              taskType: e.taskType,
              platform: e.platform,
              url: e.url || '',
              status: e.status,
              indexed: e.indexed,
              engagement: e.engagement,
              notes: e.notes || '',
            });
          }
          finalEntries = await sanityClient.fetch(`*[_type == "trackerEntry"] | order(date desc){
            "id": _id,
            "lastUpdated": _updatedAt,
            "clientId": clientRef._ref,
            date, taskType, platform, url, status, indexed, engagement, notes
          }`);
        }
        localStorage.setItem('sanity-tracker-migrated', 'true');
      }

      setEntries(finalEntries);
    } catch (err: any) {
      console.error("Failed to fetch from Sanity:", err);
      setSyncError(err.message || "Failed to load tracker entries.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Helper to sync to Google Sheets (secondary backup if URL exists)
  const sendActionToSheet = async (payload: any, customUrl?: string) => {
    const targetUrl = customUrl || syncUrl;
    if (!targetUrl) return;
    try {
      await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Failed to sync to Google Sheets:", err);
    }
  };

  const addEntry = async (entryData: Omit<Entry, 'id' | 'lastUpdated'>, customUrl?: string) => {
    try {
      const doc = await sanityClient.create({
        _type: 'trackerEntry',
        clientRef: entryData.clientId ? { _type: 'reference', _ref: entryData.clientId } : undefined,
        date: entryData.date,
        taskType: entryData.taskType,
        platform: entryData.platform,
        url: entryData.url,
        status: entryData.status,
        indexed: entryData.indexed,
        engagement: entryData.engagement,
        notes: entryData.notes,
      });

      const newEntry: Entry = {
        ...entryData,
        id: doc._id,
        lastUpdated: doc._updatedAt,
      };
      
      setEntries(prev => [newEntry, ...prev]);
      toast.success('Entry added');

      // Backup to Sheets
      sendActionToSheet({ action: 'add', entry: newEntry }, customUrl);
    } catch (e) {
      toast.error('Failed to add entry');
    }
  };

  const deleteEntry = async (id: string, customUrl?: string) => {
    try {
      await sanityClient.delete(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Entry removed');

      // Backup to Sheets
      sendActionToSheet({ action: 'delete', id }, customUrl);
    } catch (e) {
      toast.error('Failed to delete entry');
    }
  };

  const updateEntry = async (id: string, updated: Partial<Entry>, customUrl?: string) => {
    try {
      const doc = await sanityClient.patch(id).set(updated).commit();
      let updatedEntry: Entry | undefined;
      
      setEntries(prev => prev.map(e => {
        if (e.id === id) {
          updatedEntry = { ...e, ...updated, lastUpdated: doc._updatedAt };
          return updatedEntry;
        }
        return e;
      }));

      toast.success('Entry updated');

      // Backup to Sheets
      if (updatedEntry) {
        sendActionToSheet({ action: 'update', entry: updatedEntry }, customUrl);
      }
    } catch (e) {
      toast.error('Failed to update entry');
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
