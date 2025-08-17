'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { authService } from '@/lib/supabase/auth'
import { databaseService } from '@/lib/supabase/database'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [authStatus, setAuthStatus] = useState<'checking' | 'working' | 'error'>('checking')
  const [dbStatus, setDbStatus] = useState<'checking' | 'working' | 'error'>('checking')
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    setTestResults([])
    addResult('Starting Supabase tests...')

    // Test 1: Environment variables
    if (!isSupabaseConfigured) {
      setConnectionStatus('error')
      addResult('❌ Environment variables not configured')
      return
    }
    
    setConnectionStatus('connected')
    addResult('✅ Environment variables configured')

    // Test 2: Authentication service
    try {
      const { user, error } = await authService.getCurrentUser()
      if (error && error.message !== 'Auth user not found') {
        throw error
      }
      setAuthStatus('working')
      addResult('✅ Authentication service working')
      addResult(`Current user: ${user ? user.email : 'Not signed in'}`)
    } catch (error) {
      setAuthStatus('error')
      addResult(`❌ Authentication error: ${error}`)
    }

    // Test 3: Database connection
    try {
      // Try to query the users table (will fail gracefully if no data)
      const { data, error } = await databaseService.getUser('test-id')
      
      if (error && !error.message.includes('JSON object requested, multiple (or zero) rows returned')) {
        // This specific error is expected when user doesn't exist
        if (error.message.includes('relation "users" does not exist')) {
          addResult('❌ Database tables not created yet. Please run the SQL schema.')
          setDbStatus('error')
          return
        }
        throw error
      }
      
      setDbStatus('working')
      addResult('✅ Database connection working')
      addResult('✅ Database tables accessible')
    } catch (error) {
      setDbStatus('error')
      addResult(`❌ Database error: ${error}`)
    }
  }

  const testSignUp = async () => {
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpassword123'
    
    addResult(`Testing sign up with ${testEmail}...`)
    
    try {
      const { user, error } = await authService.signUp(testEmail, testPassword, 'Test User')
      
      if (error) {
        addResult(`❌ Sign up error: ${error.message}`)
        return
      }
      
      if (user) {
        addResult('✅ Sign up successful!')
        addResult(`User created: ${user.email}`)
        
        // Test database user creation
        setTimeout(async () => {
          const { data } = await databaseService.getUser(user.id)
          if (data) {
            addResult('✅ User automatically created in database')
          } else {
            addResult('⚠️ User not found in database (may take a moment)')
          }
        }, 2000)
      }
    } catch (error) {
      addResult(`❌ Unexpected sign up error: ${error}`)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
          <CardDescription>
            Test your Supabase configuration and connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span>Environment</span>
              <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}>
                {connectionStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Authentication</span>
              <Badge variant={authStatus === 'working' ? 'default' : authStatus === 'error' ? 'destructive' : 'secondary'}>
                {authStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Database</span>
              <Badge variant={dbStatus === 'working' ? 'default' : dbStatus === 'error' ? 'destructive' : 'secondary'}>
                {dbStatus}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={testConnection} variant="outline">
              Test Connection
            </Button>
            <Button onClick={testSignUp} variant="outline">
              Test Sign Up
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Test Results:</h4>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm space-y-1 max-h-60 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="font-mono text-xs">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isSupabaseConfigured && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">
              Configuration Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 dark:text-yellow-300 mb-3">
              Please create a <code>.env.local</code> file with your Supabase credentials:
            </p>
            <pre className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here`}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
