"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockBatches } from "@/lib/mock-data"
import type { Batch } from "@/types/batch"
import { Edit, Trash2, Eye } from "lucide-react"

const getStatusVariant = (status: Batch["status"]) => {
  switch (status) {
    case "delivered":
      return "success"
    case "verified":
      return "info"
    case "in-transit":
      return "warning"
    case "pending":
      return "secondary"
    default:
      return "default"
  }
}

export function BatchManagement() {
  const [batches, setBatches] = useState(mockBatches)
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)

  const updateBatchStatus = (batchId: string, newStatus: Batch["status"]) => {
    setBatches((prev) =>
      prev.map((batch) =>
        batch.id === batchId
          ? { ...batch, status: newStatus, lastUpdated: new Date().toISOString().split("T")[0] }
          : batch,
      ),
    )
    alert(`Batch ${batchId} status updated to ${newStatus}`)
  }

  const deleteBatch = (batchId: string) => {
    if (confirm(`Are you sure you want to delete batch ${batchId}?`)) {
      setBatches((prev) => prev.filter((batch) => batch.id !== batchId))
      alert(`Batch ${batchId} deleted successfully`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Management</CardTitle>
        <CardDescription>View, edit, and manage existing supply chain batches</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Blockchain</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.id}</TableCell>
                  <TableCell>{batch.company}</TableCell>
                  <TableCell>{batch.product}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(batch.status)}>{batch.status}</Badge>
                      <Select
                        value={batch.status}
                        onValueChange={(value) => updateBatchStatus(batch.id, value as Batch["status"])}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-transit">In Transit</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {batch.blockchain}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedBatch(batch.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteBatch(batch.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
