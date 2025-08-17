import { createClient } from './client'
import { AuthError, User } from '@supabase/supabase-js'

export type AuthResult = {
  user: User | null
  error: AuthError | null
}

export class AuthService {
  private supabase = createClient()

  async signUp(email: string, password: string, fullName?: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        console.error('Sign up error:', error)
        return { user: null, error }
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Unexpected sign up error:', error)
      return { 
        user: null, 
        error: { message: 'An unexpected error occurred during sign up' } as AuthError 
      }
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        return { user: null, error }
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Unexpected sign in error:', error)
      return { 
        user: null, 
        error: { message: 'An unexpected error occurred during sign in' } as AuthError 
      }
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        return { error }
      }
      return { error: null }
    } catch (error) {
      console.error('Unexpected sign out error:', error)
      return { error: { message: 'An unexpected error occurred during sign out' } as AuthError }
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error) {
        console.error('Get user error:', error)
        return { user: null, error }
      }

      return { user, error: null }
    } catch (error) {
      console.error('Unexpected get user error:', error)
      return { 
        user: null, 
        error: { message: 'An unexpected error occurred while getting user' } as AuthError 
      }
    }
  }

  async getCurrentSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        console.error('Get session error:', error)
        return { session: null, error }
      }

      return { session, error: null }
    } catch (error) {
      console.error('Unexpected get session error:', error)
      return { 
        session: null, 
        error: { message: 'An unexpected error occurred while getting session' } as AuthError 
      }
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

// Export a singleton instance
export const authService = new AuthService()
