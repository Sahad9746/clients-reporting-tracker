import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  useCdn: false, // We want fresh data always
  apiVersion: import.meta.env.VITE_SANITY_API_VERSION || '2024-05-13',
  token: import.meta.env.VITE_SANITY_TOKEN,
  ignoreBrowserTokenWarning: true,
});

console.log("Sanity Token Loaded in Browser:", !!import.meta.env.VITE_SANITY_TOKEN);
