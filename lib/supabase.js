import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

const mockSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async ({ email, password }) => {
      console.warn('Supabase is running in local standalone mode.');
      return { data: { user: { email, id: 'local-user' } }, error: null };
    },
    signUp: async ({ email, password }) => {
      console.warn('Supabase is running in local standalone mode.');
      return { data: { user: { email, id: 'local-user' } }, error: null };
    },
    signInWithOAuth: async ({ provider }) => {
      console.warn('Supabase OAuth requires SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
      throw new Error(`Supabase OAuth (${provider}) requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env`);
    },
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({ single: async () => ({ data: null, error: null }), eq: async () => ({ data: [], error: null }) }),
      order: () => ({ limit: async () => ({ data: [], error: null }) }),
    }),
    insert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null }),
  }),
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : mockSupabase;

/**
 * Synchronize a Supabase user with BotHive server session
 */
export async function syncSupabaseUser(user) {
  if (!user || !user.email) return null;
  try {
    const role =
      user.app_metadata?.role ||
      user.user_metadata?.role ||
      user.role ||
      (user.user_metadata?.is_admin ? 'admin' : undefined) ||
      (user.app_metadata?.is_admin ? 'admin' : undefined);

    const res = await fetch('/api/auth/oauth-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        id: user.id,
        role: role,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      }),
    });
    if (!res.ok) throw new Error('Failed to synchronize user session');
    return await res.json();
  } catch (err) {
    console.error('Session sync error:', err);
    throw err;
  }
}
