import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// WebSocket fix for Node.js < 22 during build
const isServer = typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !isServer,
  },
  global: {
    fetch: (...args) => fetch(...args),
  },
  ...(isServer ? { realtime: { transport: (await import('ws')).default } } : {})
});
