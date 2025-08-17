import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { AddBatchForm } from "@/components/add-batch-form"
import { BatchManagement } from "@/components/batch-management"
import { BulkOperations } from "@/components/bulk-operations"
import { TeamManagement } from "@/components/team-management"

export default function ManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-6 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Supply Chain Management</h1>
              <p className="text-muted-foreground">
                Create, edit, and manage your supply chain batches and blockchain operations
              </p>
            </div>

            <div className="grid gap-6">
              <AddBatchForm />
              <BatchManagement />
              <TeamManagement />
              <BulkOperations />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

