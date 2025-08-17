import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BatchesTable } from "@/components/batches-table"

export default function DashboardPage() {
  console.log("🟦 DASHBOARD RUNNING FROM /src/app/ FOLDER")
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-6 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Supply Chain Dashboard</h1>
              <p className="text-muted-foreground">
                Track and manage your supply chain batches across multiple blockchain networks
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium">Total Batches</h3>
                </div>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Active supply chain batches</p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium">In Transit</h3>
                </div>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Currently being shipped</p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium">Delivered</h3>
                </div>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Successfully delivered</p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium">Verified</h3>
                </div>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Blockchain verified</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Batches</h2>
              <BatchesTable />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

