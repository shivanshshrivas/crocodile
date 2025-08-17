"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BatchDetailModal } from "@/components/batch-detail-modal"
import { mockBatches } from "@/lib/mock-data"
import type { Batch } from "@/types/batch"

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

const getBlockchainColor = (blockchain: Batch["blockchain"]) => {
  switch (blockchain) {
    case "Ethereum":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "Polygon":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    case "Solana":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "Hyperledger":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    case "Binance Smart Chain":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
}

const getStageLabel = (stage: Batch["supplyChainStage"]) => {
  switch (stage) {
    case "raw-material":
      return "Raw Material"
    case "processing":
      return "Processing"
    case "manufacturing":
      return "Manufacturing"
    case "finished-product":
      return "Finished Product"
    default:
      return stage
  }
}

export function BatchesTable() {
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleRowClick = (batch: Batch) => {
    setSelectedBatch(batch)
    setModalOpen(true)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch ID</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current Stage</TableHead>
              <TableHead>Blockchain</TableHead>
              <TableHead>Lead Time</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockBatches.map((batch) => (
              <TableRow
                key={batch.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(batch)}
              >
                <TableCell className="font-medium">{batch.id}</TableCell>
                <TableCell>{batch.currentStageCompany}</TableCell>
                <TableCell>{batch.product}</TableCell>
                <TableCell>{batch.quantity.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(batch.status)}>{batch.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getStageLabel(batch.supplyChainStage)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getBlockchainColor(batch.blockchain)}>{batch.blockchain}</Badge>
                </TableCell>
                <TableCell>{Math.round(batch.leadTimeHours / 24)}d</TableCell>
                <TableCell>{new Date(batch.lastUpdated).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BatchDetailModal batch={selectedBatch} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
