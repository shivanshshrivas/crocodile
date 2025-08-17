// Auth bypass - minimal version
export function AuthProvider({ children }: any) {
  return children
}

export function useAuth() {
  return {
    user: { email: 'demo@example.com', id: 'demo-user' },
    loading: false,
    signUp: async () => ({ user: { email: 'demo@example.com' }, error: null }),
    signIn: async () => ({ user: { email: 'demo@example.com' }, error: null }),
    signOut: async () => {},
    isAuthenticated: true,
  }
}
