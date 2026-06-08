export default {
  name: 'dailyLead',
  title: 'Daily Lead Entry',
  type: 'document',
  fields: [
    {
      name: 'clientRef',
      title: 'Client',
      type: 'reference',
      to: [{ type: 'client' }],
      description: 'Which client this lead entry belongs to',
      validation: (Rule: any) => Rule.required(),
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
      name: 'leads',
      title: 'Leads Generated',
      type: 'number',
      initialValue: 0,
      validation: (Rule: any) => Rule.required().min(0),
    },
    {
      name: 'source',
      title: 'Lead Source',
      type: 'string',
      options: {
        list: [
          { title: 'Google Ads', value: 'Google Ads' },
          { title: 'Meta Ads', value: 'Meta Ads' },
          { title: 'LinkedIn Ads', value: 'LinkedIn Ads' },
          { title: 'Organic SEO', value: 'Organic SEO' },
          { title: 'Email Marketing', value: 'Email Marketing' },
          { title: 'Outreach', value: 'Outreach' },
          { title: 'Referral', value: 'Referral' },
          { title: 'Other', value: 'Other' },
        ],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'notes',
      title: 'Notes',
      type: 'text',
    },
  ],
};
