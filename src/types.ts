export type TaskType = 'Article' | 'PR' | 'Outreach' | 'Content' | 'SEO';
export type Status = 'Live' | 'Pending' | 'Completed' | 'Removed';
export type EngagementLevel = 'Low' | 'Medium' | 'High';

export interface Entry {
  id: string;
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
