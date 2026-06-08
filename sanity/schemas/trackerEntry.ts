export default {
  name: 'trackerEntry',
  title: 'Tracker Entry',
  type: 'document',
  fields: [
    {
      name: 'clientRef',
      title: 'Client',
      type: 'reference',
      to: [{ type: 'client' }],
      description: 'Which client this tracker entry belongs to',
    },
    {
      name: 'date',
      title: 'Date',
      type: 'date',
      options: {
        dateFormat: 'YYYY-MM-DD',
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'taskType',
      title: 'Task Type',
      type: 'string',
      options: {
        list: ['Article', 'PR', 'Outreach', 'Content', 'SEO'],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'platform',
      title: 'Platform',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'url',
      title: 'URL',
      type: 'url',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: ['Live', 'Pending', 'Completed', 'Removed'],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'indexed',
      title: 'Indexed on Google',
      type: 'string',
      options: {
        list: ['Yes', 'No'],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'engagement',
      title: 'Engagement Level',
      type: 'string',
      options: {
        list: ['Low', 'Medium', 'High'],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'notes',
      title: 'Notes',
      type: 'text',
    },
    {
      name: 'leads',
      title: 'Leads Generated',
      type: 'number',
      initialValue: 0,
      validation: (Rule: any) => Rule.min(0),
    },
  ],
};
