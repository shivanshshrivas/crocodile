import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// User interface
export interface User {
  id?: string
  email: string
  password: string
  full_name: string
  company_name?: string
  created_at?: string
}

// Simple auth functions
export const authService = {
  // Sign up - just store user data
  async signUp(userData: User) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email: userData.email,
          password_hash: userData.password, // In real app, hash this
          full_name: userData.full_name,
          company_name: userData.company_name
        }])
        .select()
        .single()

      return { user: data, error }
    } catch (error) {
      return { user: null, error }
    }
  },

  // Login - check if user exists
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password) // In real app, verify hash
        .single()

      if (error || !data) {
        return { user: null, error: { message: 'Invalid email or password' } }
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id)

      return { user: data, error: null }
    } catch (error) {
      return { user: null, error }
    }
  },

  // Get user by email
  async getUserByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      return { user: data, error }
    } catch (error) {
      return { user: null, error }
    }
  },

  // Get all users
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      return { users: data || [], error }
    } catch (error) {
      return { users: [], error }
    }
  }
}
