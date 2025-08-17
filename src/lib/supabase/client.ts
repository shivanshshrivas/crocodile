import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export const createClient = () => {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables are not set. Please check your .env.local file.")
    // Return a mock client for development
    return {
      auth: {
        signUp: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        signIn: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        signOut: () => Promise.resolve({ error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } })
            })
          })
        }),
        insert: () => ({
          select: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } })
        }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } })
        }),
        delete: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } })
      })
    }
  }
  
  return createClientComponentClient()
}

// Create a singleton instance of the Supabase client for Client Components
export const supabase = createClient()
