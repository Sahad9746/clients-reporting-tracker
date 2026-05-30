export default {
  name: 'channelsSettings',
  title: 'Channels Settings',
  type: 'document',
  fields: [
    {
      name: 'channels',
      title: 'Channels List',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'channelItem',
          title: 'Channel Item',
          fields: [
            {
              name: 'value',
              title: 'Value (ID)',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'label',
              title: 'Label (Name)',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'color',
              title: 'Hex Brand Color',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'bg',
              title: 'Hex Light BG Color',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'iconName',
              title: 'Lucide Icon Name',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
          ],
        },
      ],
    },
  ],
};
