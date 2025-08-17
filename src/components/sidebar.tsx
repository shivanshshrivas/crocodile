"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'

// Direct Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://itobpwmrtzmehslljqiz.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ppbf8V9jFXiQJHqV2bqgMg_jooqeiL8'
const supabase = createClient(supabaseUrl, supabaseKey)
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Users, Building2, Mail } from "lucide-react"

interface Workspace {
  id: string
  name: string
  company_email: string
  created_at: string
}

export function Sidebar() {
  const [newWorkspaceEmail, setNewWorkspaceEmail] = useState("")
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [joinWorkspaceEmail, setJoinWorkspaceEmail] = useState("")
  const [isNewWorkspaceOpen, setIsNewWorkspaceOpen] = useState(false)
  const [isJoinWorkspaceOpen, setIsJoinWorkspaceOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Load user data and workspaces on component mount
  useEffect(() => {
    const userData = localStorage.getItem('currentUser')
    const workspaceData = localStorage.getItem('userWorkspaces')
    
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
      console.log("🔄 Loaded user:", user)
    }
    
    if (workspaceData) {
      const userWorkspaces = JSON.parse(workspaceData)
      setWorkspaces(userWorkspaces)
      if (userWorkspaces.length > 0) {
        setCurrentWorkspace(userWorkspaces[0])
      }
      console.log("🔄 Loaded workspaces:", userWorkspaces)
    }
  }, [])

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      alert("Please log in first")
      return
    }

    try {
      // Create workspace in Supabase
      const { data: workspaceData, error } = await supabase
        .from('workspaces')
        .insert([{
          user_id: currentUser.id,
          workspace_name: newWorkspaceName,
          workspace_description: `${newWorkspaceName} workspace`
        }])
        .select()
        .single()

      if (error) {
        console.error("Error creating workspace:", error)
        alert("Failed to create workspace")
        return
      }

      // Add to local state
      const newWorkspace: Workspace = {
        id: workspaceData.id,
        name: workspaceData.workspace_name,
        company_email: newWorkspaceEmail, // Store the email input locally
        created_at: workspaceData.created_at,
      }

      setWorkspaces((prev) => [newWorkspace, ...prev])
      setCurrentWorkspace(newWorkspace)
      
      // Update localStorage
      const updatedWorkspaces = [newWorkspace, ...workspaces]
      localStorage.setItem('userWorkspaces', JSON.stringify(updatedWorkspaces))

      alert(`Workspace "${newWorkspaceName}" created successfully!`)

      setNewWorkspaceEmail("")
      setNewWorkspaceName("")
      setIsNewWorkspaceOpen(false)

    } catch (error) {
      console.error("Unexpected error:", error)
      alert("Failed to create workspace")
    }
  }

  const handleJoinWorkspace = (e: React.FormEvent) => {
    e.preventDefault()

    const foundWorkspace = workspaces.find((w) => w.company_email === joinWorkspaceEmail)

    if (foundWorkspace) {
      setCurrentWorkspace(foundWorkspace)
      alert(`Successfully joined ${foundWorkspace.name}`)
    } else {
      alert("Workspace not found with that company email.")
    }

    setJoinWorkspaceEmail("")
    setIsJoinWorkspaceOpen(false)
  }

  return (
    <div className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold">Workspace</span>
          </div>

          <div className="space-y-3">
            {/* New Workspace */}
            <Dialog open={isNewWorkspaceOpen} onOpenChange={setIsNewWorkspaceOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  New Workspace
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workspace</DialogTitle>
                  <DialogDescription>Create a new workspace for your supply chain operations</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateWorkspace} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <Input
                      id="workspace-name"
                      type="text"
                      placeholder="My Company Workspace"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspace-email">Company Email</Label>
                    <Input
                      id="workspace-email"
                      type="email"
                      placeholder="company@example.com"
                      value={newWorkspaceEmail}
                      onChange={(e) => setNewWorkspaceEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsNewWorkspaceOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Workspace</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Join Workspace */}
            <Sheet open={isJoinWorkspaceOpen} onOpenChange={setIsJoinWorkspaceOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                  <Users className="h-4 w-4" />
                  Join Workspace
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Join Workspace</SheetTitle>
                  <SheetDescription>Enter the company email to join an existing workspace</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleJoinWorkspace} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="join-email">Company Email</Label>
                    <Input
                      id="join-email"
                      type="email"
                      placeholder="company@example.com"
                      value={joinWorkspaceEmail}
                      onChange={(e) => setJoinWorkspaceEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsJoinWorkspaceOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Join Workspace</Button>
                  </div>
                </form>
              </SheetContent>
            </Sheet>
          </div>

          {workspaces.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Your Workspaces</h3>
              <div className="space-y-1">
                {workspaces.map((workspace) => (
                  <Button
                    key={workspace.id}
                    variant={currentWorkspace?.id === workspace.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-xs"
                    onClick={() => setCurrentWorkspace(workspace)}
                  >
                    {workspace.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current Workspace Info */}
        <div className="mt-auto p-6 border-t">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Current Workspace</CardTitle>
              <CardDescription className="text-xs">{currentWorkspace?.name || "No workspace selected"}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{currentWorkspace?.company_email || "No email"}</span>
              </div>
              <p className="text-xs text-green-600 mt-2">Pure UI mode - ready for API integration</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
