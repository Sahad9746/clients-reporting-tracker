import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { DailyLead } from '../types';
import { toast } from 'react-hot-toast';
import { sanityClient } from '../lib/sanity';

interface LeadsContextType {
  dailyLeads: DailyLead[];
  addLead: (lead: Omit<DailyLead, 'id' | 'lastUpdated'>, customUrl?: string) => Promise<void>;
  deleteLead: (id: string, customUrl?: string) => Promise<void>;
  updateLead: (id: string, updated: Partial<DailyLead>, customUrl?: string) => Promise<void>;
  isLoading: boolean;
  syncError: string | null;
  refresh: () => Promise<void>;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

export const LeadsProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [dailyLeads, setDailyLeads] = useState<DailyLead[]>([]);

  const syncUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL || '';

  const fetchLeads = useCallback(async () => {
    if (!import.meta.env.VITE_SANITY_PROJECT_ID) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setSyncError(null);
    try {
      const sanityLeads = await sanityClient.fetch(`*[_type == "dailyLead"] | order(date desc){
        "id": _id,
        "lastUpdated": _updatedAt,
        "clientId": clientRef._ref,
        date, leads, source, notes
      }`);
      setDailyLeads(sanityLeads);
    } catch (err: any) {
      console.error("Failed to fetch leads from Sanity:", err);
      setSyncError(err.message || "Failed to load daily leads.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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
      console.error("Failed to sync leads to Google Sheets:", err);
    }
  };

  const addLead = async (leadData: Omit<DailyLead, 'id' | 'lastUpdated'>, customUrl?: string) => {
    try {
      const doc = await sanityClient.create({
        _type: 'dailyLead',
        clientRef: { _type: 'reference', _ref: leadData.clientId },
        date: leadData.date,
        leads: leadData.leads,
        source: leadData.source,
        notes: leadData.notes,
      });

      const newLead: DailyLead = {
        ...leadData,
        id: doc._id,
        lastUpdated: doc._updatedAt,
      };

      setDailyLeads(prev => [newLead, ...prev]);
      toast.success('Daily lead entry added');

      // Backup to Sheets
      sendActionToSheet({ action: 'addLead', lead: newLead }, customUrl);
    } catch (e) {
      console.error(e);
      toast.error('Failed to add lead entry');
    }
  };

  const deleteLead = async (id: string, customUrl?: string) => {
    try {
      await sanityClient.delete(id);
      setDailyLeads(prev => prev.filter(l => l.id !== id));
      toast.success('Daily lead entry removed');

      // Backup to Sheets
      sendActionToSheet({ action: 'deleteLead', id }, customUrl);
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete lead entry');
    }
  };

  const updateLead = async (id: string, updated: Partial<DailyLead>, customUrl?: string) => {
    try {
      const { id: _, lastUpdated: __, clientId, ...patchData } = updated;
      
      const patchPayload: any = { ...patchData };
      if (clientId) {
        patchPayload.clientRef = { _type: 'reference', _ref: clientId };
      }

      const doc = await sanityClient.patch(id).set(patchPayload).commit();
      let updatedLead: DailyLead | undefined;

      setDailyLeads(prev => prev.map(l => {
        if (l.id === id) {
          updatedLead = { ...l, ...updated, lastUpdated: doc._updatedAt };
          return updatedLead;
        }
        return l;
      }));

      toast.success('Daily lead entry updated');

      // Backup to Sheets
      if (updatedLead) {
        sendActionToSheet({ action: 'updateLead', lead: updatedLead }, customUrl);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update lead entry');
    }
  };

  return (
    <LeadsContext.Provider value={{ dailyLeads, addLead, deleteLead, updateLead, isLoading, syncError, refresh: fetchLeads }}>
      {children}
    </LeadsContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadsContext);
  if (!context) throw new Error('useLeads must be used within LeadsProvider');
  return context;
};
