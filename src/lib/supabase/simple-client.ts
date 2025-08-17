import { createClient } from '@supabase/supabase-js'

// Simple Supabase client for data storage only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabase: any = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

export { supabase }

// User data interface
export interface UserData {
  id?: string
  email: string
  full_name: string
  company_name: string
  company_email?: string
  preferred_blockchain?: string
  created_at?: string
}

// Simple user service - no authentication, just data storage
export class UserService {
  
  // Add user to database
  async addUser(userData: UserData) {
    if (!supabase) {
      console.warn('Supabase not configured')
      // Return mock data for development
      return { 
        data: { ...userData, id: `mock-${Date.now()}` }, 
        error: null 
      }
    }

    try {
      // For your schema, we'll use Supabase Auth to create users
      // This will trigger your handle_new_user() function automatically
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: 'hackathon-temp-pass', // Simple password for hackathon
        options: {
          data: {
            full_name: userData.full_name,
            company_name: userData.company_name,
            company_email: userData.company_email,
            preferred_blockchain: userData.preferred_blockchain
          }
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        
        // If user already exists, try to get them instead
        if (authError.message?.includes('already registered')) {
          return this.getUserByEmail(userData.email)
        }
        
        return { data: null, error: authError }
      }

      // Your database trigger will automatically create the user in public.users
      // Return the user data
      return { 
        data: { 
          id: authData.user?.id,
          email: userData.email,
          full_name: userData.full_name,
          company_name: userData.company_name,
          company_email: userData.company_email,
          preferred_blockchain: userData.preferred_blockchain,
          created_at: new Date().toISOString()
        }, 
        error: null 
      }
    } catch (error) {
      console.error('Error adding user:', error)
      return { data: null, error }
    }
  }

  // Get user by email
  async getUserByEmail(email: string) {
    if (!supabase) {
      console.warn('Supabase not configured')
      return { data: null, error: null }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error getting user:', error)
      return { data: null, error }
    }
  }

  // Update user data
  async updateUser(userId: string, updates: Partial<UserData>) {
    if (!supabase) {
      console.warn('Supabase not configured')
      return { data: null, error: null }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating user:', error)
      return { data: null, error }
    }
  }

  // Get all users (for admin purposes)
  async getAllUsers() {
    if (!supabase) {
      console.warn('Supabase not configured')
      return { data: [], error: null }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      console.error('Error getting all users:', error)
      return { data: [], error }
    }
  }
}

// Export singleton instance
export const userService = new UserService()
