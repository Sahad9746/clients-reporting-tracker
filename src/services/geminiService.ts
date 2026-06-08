import { sanityClient } from '../lib/sanity';
import type { Client } from '../types';

const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY;
// Calls go to our own Vercel Edge Function (/api/generate-report) to avoid CORS
const NVIDIA_URL = '/api/generate-report';

export interface ReportData {
  tasksSummary: {
    total: number;
    live: number;
    pending: number;
    completed: number;
    inReview: number;
    byType: Record<string, number>;
    totalLeads: number;
  };
  entries: Array<{
    date: string;
    taskType: string;
    platform: string;
    url: string;
    status: string;
    indexed: string;
    engagement: string;
    notes: string;
    leads?: number;
  }>;
  dateRangeStart: string;
  dateRangeEnd: string;
}

/** Fetch tracker entries from Sanity for a custom date range */
export async function fetchWeeklyData(clientId?: string, startDate?: string, endDate?: string): Promise<ReportData> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const from = startDate ?? sevenDaysAgo.toISOString().split('T')[0];
  const to = endDate ?? new Date().toISOString().split('T')[0];

  const clientFilter = clientId ? `&& clientRef._ref == "${clientId}"` : '';

  const query = `*[_type == "trackerEntry" && date >= "${from}" && date <= "${to}" ${clientFilter}] | order(date desc) {
    "id": _id,
    date,
    taskType,
    platform,
    url,
    status,
    indexed,
    engagement,
    notes,
    leads
  }`;

  const entries = await sanityClient.fetch(query);

  const tasksSummary = {
    total: entries.length,
    live: entries.filter((e: any) => e.status === 'Live').length,
    pending: entries.filter((e: any) => e.status === 'Pending').length,
    completed: entries.filter((e: any) => e.status === 'Completed').length,
    inReview: entries.filter((e: any) => e.status === 'In Review').length,
    byType: entries.reduce((acc: Record<string, number>, e: any) => {
      acc[e.taskType] = (acc[e.taskType] || 0) + 1;
      return acc;
    }, {}),
    totalLeads: entries.reduce((sum: number, e: any) => sum + (e.leads || 0), 0),
  };

  return { tasksSummary, entries, dateRangeStart: from, dateRangeEnd: to };
}

/** Build the prompt text from the fetched data */
function buildPrompt(data: ReportData, clientName: string): string {
  const entryLines = data.entries.map(e =>
    `- [${e.date}] ${e.taskType} | ${e.platform} | Status: ${e.status} | Leads Generated: ${e.leads ?? 0} | Indexed: ${e.indexed} | Engagement: ${e.engagement}${e.notes ? ` | Notes: ${e.notes}` : ''}`
  ).join('\n');

  return `You are acting as a CTO providing a weekly performance summary to a client.

Client: ${clientName}
Report Period: ${data.dateRangeStart} to ${data.dateRangeEnd}

TASK & LEAD SUMMARY:
- Total Tasks: ${data.tasksSummary.total}
- Live: ${data.tasksSummary.live}
- Pending: ${data.tasksSummary.pending}  
- Completed: ${data.tasksSummary.completed}
- Total Leads Generated: ${data.tasksSummary.totalLeads}
- By Type: ${Object.entries(data.tasksSummary.byType).map(([k, v]) => `${k}: ${v}`).join(', ')}

DETAILED ENTRIES:
${entryLines || 'No entries found for this period.'}

Generate a clean, professional weekly report in Markdown format. Include:
1. A brief executive summary (2-3 sentences)
2. Key wins and accomplishments
3. Tasks by channel/type breakdown
4. Any stalled or pending items to watch
5. A forward-looking note for the coming week

Keep it concise, data-driven, and client-friendly. Use Markdown headers and bullet points.`;
}

/** Call NVIDIA NIM API and return the generated markdown */
export async function generateAISummary(data: ReportData, client: Client): Promise<string> {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA API key is not configured. Add VITE_NVIDIA_API_KEY to your .env file.');
  }

  const prompt = buildPrompt(data, client.name);

  const response = await fetch(NVIDIA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are a CTO providing a professional weekly performance report to a client. Write in clean, concise Markdown format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`NVIDIA API error: ${err?.detail ?? err?.message ?? response.statusText}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content ?? 'No report generated.';
}

/** Save a generated report to Sanity */
export async function saveReportToSanity(
  content: string,
  data: ReportData,
  client: Client
): Promise<void> {
  await sanityClient.create({
    _type: 'report',
    title: `Weekly Report — ${client.name} — ${data.dateRangeEnd}`,
    clientRef: { _type: 'reference', _ref: client.id },
    content,
    tasksAnalyzed: data.tasksSummary.total,
    dateRangeStart: data.dateRangeStart,
    dateRangeEnd: data.dateRangeEnd,
    generatedAt: new Date().toISOString(),
  });
}
