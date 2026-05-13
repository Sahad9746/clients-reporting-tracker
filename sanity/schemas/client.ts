export default {
  name: 'client',
  title: 'Client',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'color',
      title: 'Color Hex',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'pilotLabel',
      title: 'Pilot / Period Label',
      type: 'string',
    },
    {
      name: 'password',
      title: 'Password',
      type: 'string',
      description: 'Client login password',
    },
    {
      name: 'isDefault',
      title: 'Is Default',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'googleSheetUrl',
      title: 'Google Sheet App URL',
      type: 'string',
      description: 'The Google Apps Script Web App URL for this specific client (optional)',
    },
  ],
};
