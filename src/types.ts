export type TaskType = 'Article' | 'PR' | 'Outreach' | 'Content' | 'SEO';
export type Status = 'Live' | 'Pending' | 'Completed' | 'Removed';
export type EngagementLevel = 'Low' | 'Medium' | 'High';

// ── Multi-client ────────────────────────────────────────────────────────────
export interface Client {
  id: string;
  name: string;
  color: string;
  pilotLabel: string;
  createdAt: string;
  isDefault?: boolean;
  password?: string; // set by super admin — enables client login
  googleSheetUrl?: string; // specific Google Apps Script URL for this client
}

// --- iQue Cap Content Calendar ---
export type CalendarChannel = string;
export type CalendarStatus = 'pending' | 'in_review' | 'approved' | 'live' | 'blocked';

export interface DynamicChannel {
  value: string;
  label: string;
  color: string;
  bg: string;
  iconName: string;
}

export interface ContentTask {
  id: string;
  title: string;
  channel: CalendarChannel;
  week?: number;
  scheduledDate: string; // YYYY-MM-DD
  description: string;
  approvalNote: string;
  status: CalendarStatus;
  clientName: string;
  deliverableCount: string;
}

export interface Entry {
  id: string;
  clientId?: string;
  date: string;
  taskType: TaskType;
  platform: string;
  url: string;
  status: Status;
  indexed: 'Yes' | 'No';
  engagement: EngagementLevel;
  notes: string;
  lastUpdated: string;
}
