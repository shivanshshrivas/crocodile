import { createClient } from './client'

export interface User {
  id: string
  email: string
  full_name?: string
  company_name?: string
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  company_email: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
}

export interface UserWallet {
  id: string
  user_id: string
  wallet_address: string
  wallet_type: string
  blockchain_network: string
  is_primary: boolean
  created_at: string
}

export class DatabaseService {
  private supabase = createClient()

  // User operations
  async getUser(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    return { data, error }
  }

  async updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  }

  // Workspace operations
  async createWorkspace(name: string, companyEmail: string, createdBy: string) {
    const { data, error } = await this.supabase
      .from('workspaces')
      .insert({
        name,
        company_email: companyEmail,
        created_by: createdBy,
      })
      .select()
      .single()

    if (!error && data) {
      // Add creator as admin member
      await this.addWorkspaceMember(data.id, createdBy, 'admin')
    }

    return { data, error }
  }

  async getUserWorkspaces(userId: string) {
    const { data, error } = await this.supabase
      .from('workspaces')
      .select(`
        *,
        workspace_members!inner (
          role,
          joined_at
        )
      `)
      .eq('workspace_members.user_id', userId)

    return { data, error }
  }

  async getWorkspace(workspaceId: string) {
    const { data, error } = await this.supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single()

    return { data, error }
  }

  // Workspace member operations
  async addWorkspaceMember(workspaceId: string, userId: string, role: 'admin' | 'member' = 'member') {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role,
      })
      .select()
      .single()

    return { data, error }
  }

  async getWorkspaceMembers(workspaceId: string) {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .select(`
        *,
        users (
          id,
          email,
          full_name
        )
      `)
      .eq('workspace_id', workspaceId)

    return { data, error }
  }

  async updateMemberRole(workspaceId: string, userId: string, role: 'admin' | 'member') {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select()
      .single()

    return { data, error }
  }

  async removeMember(workspaceId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select()

    return { data, error }
  }

  // Wallet operations
  async addUserWallet(
    userId: string,
    walletAddress: string,
    walletType: string,
    blockchainNetwork: string,
    isPrimary: boolean = false
  ) {
    // If this is set as primary, unset other primary wallets
    if (isPrimary) {
      await this.supabase
        .from('user_wallets')
        .update({ is_primary: false })
        .eq('user_id', userId)
    }

    const { data, error } = await this.supabase
      .from('user_wallets')
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        wallet_type: walletType,
        blockchain_network: blockchainNetwork,
        is_primary: isPrimary,
      })
      .select()
      .single()

    return { data, error }
  }

  async getUserWallets(userId: string) {
    const { data, error } = await this.supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    return { data, error }
  }

  async removeUserWallet(walletId: string) {
    const { data, error } = await this.supabase
      .from('user_wallets')
      .delete()
      .eq('id', walletId)
      .select()

    return { data, error }
  }

  async setPrimaryWallet(userId: string, walletId: string) {
    // First, unset all primary wallets for the user
    await this.supabase
      .from('user_wallets')
      .update({ is_primary: false })
      .eq('user_id', userId)

    // Then set the selected wallet as primary
    const { data, error } = await this.supabase
      .from('user_wallets')
      .update({ is_primary: true })
      .eq('id', walletId)
      .eq('user_id', userId)
      .select()
      .single()

    return { data, error }
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService()
