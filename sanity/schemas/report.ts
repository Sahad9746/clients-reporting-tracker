const reportSchema = {
  name: 'report',
  title: 'AI Weekly Reports',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Report Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'clientRef',
      title: 'Client',
      type: 'reference',
      to: [{ type: 'client' }],
    },
    {
      name: 'content',
      title: 'AI Generated Content (Markdown)',
      type: 'text',
    },
    {
      name: 'tasksAnalyzed',
      title: 'Tasks Analyzed Count',
      type: 'number',
    },
    {
      name: 'dateRangeStart',
      title: 'Date Range Start',
      type: 'date',
    },
    {
      name: 'dateRangeEnd',
      title: 'Date Range End',
      type: 'date',
    },
    {
      name: 'generatedAt',
      title: 'Generated At',
      type: 'datetime',
    },
  ],
};

export default reportSchema;
