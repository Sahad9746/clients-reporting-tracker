export default {
  name: 'contentTask',
  title: 'Content Task',
  type: 'document',
  fields: [
    {
      name: 'clientRef',
      title: 'Client',
      type: 'reference',
      to: [{ type: 'client' }],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'channel',
      title: 'Channel',
      type: 'string',
      options: {
        list: ['reddit', 'quora', 'seo', 'approval', 'reporting'],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'week',
      title: 'Week',
      type: 'number',
    },
    {
      name: 'scheduledDate',
      title: 'Scheduled Date',
      type: 'date',
      options: {
        dateFormat: 'YYYY-MM-DD',
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'approvalNote',
      title: 'Approval Note',
      type: 'text',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: ['pending', 'in_review', 'approved', 'live', 'blocked'],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'deliverableCount',
      title: 'Deliverable Count',
      type: 'string',
    },
  ],
};
