"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, RefreshCw } from "lucide-react"

export function BulkOperations() {
  const [selectedOperation, setSelectedOperation] = useState<string>("")

  const handleBulkOperation = () => {
    if (!selectedOperation) return

    switch (selectedOperation) {
      case "export":
        alert("Exporting all batch data to CSV...")
        break
      case "import":
        alert("Import functionality would open file picker...")
        break
      case "sync":
        alert("Syncing with blockchain networks...")
        break
      case "verify":
        alert("Verifying all pending batches...")
        break
      default:
        break
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Operations</CardTitle>
        <CardDescription>Perform operations on multiple batches at once</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Operation</label>
              <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose bulk operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="export">Export All Data</SelectItem>
                  <SelectItem value="import">Import Batch Data</SelectItem>
                  <SelectItem value="sync">Sync with Blockchain</SelectItem>
                  <SelectItem value="verify">Verify All Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleBulkOperation} disabled={!selectedOperation} className="w-full">
              Execute Operation
            </Button>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Quick Actions</h4>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export CSV Report
              </Button>
              <Button variant="outline" className="justify-start bg-transparent">
                <Upload className="h-4 w-4 mr-2" />
                Import Batch Data
              </Button>
              <Button variant="outline" className="justify-start bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync All Chains
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">System Status</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Ethereum: Connected</Badge>
            <Badge variant="success">Polygon: Connected</Badge>
            <Badge variant="success">Solana: Connected</Badge>
            <Badge variant="warning">Hyperledger: Syncing</Badge>
            <Badge variant="success">BSC: Connected</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
