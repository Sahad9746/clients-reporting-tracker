import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import clientSchema from '../sanity/schemas/client';
import contentTaskSchema from '../sanity/schemas/contentTask';
import trackerEntrySchema from '../sanity/schemas/trackerEntry';

export default defineConfig({
  name: 'default',
  title: 'Admanics Tracker Studio',

  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  basePath: '/studio',

  plugins: [structureTool()],

  schema: {
    types: [clientSchema, contentTaskSchema, trackerEntrySchema],
  },
});
