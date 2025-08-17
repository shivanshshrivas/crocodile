"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Batch } from "@/types/batch"

const companies = [
  "Tesla Inc.",
  "Walmart",
  "Nike",
  "Pfizer",
  "Unilever",
  "Apple Inc.",
  "Nestlé",
  "Samsung",
  "Microsoft",
  "Amazon",
]

const blockchains: Batch["blockchain"][] = ["Ethereum", "Polygon", "Solana", "Hyperledger", "Binance Smart Chain"]

export function AddBatchForm() {
  const [formData, setFormData] = useState({
    company: "",
    product: "",
    quantity: "",
    blockchain: "" as Batch["blockchain"] | "",
    origin: "",
    destination: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit to an API
    console.log("New batch:", formData)
    alert("Batch created successfully!")
    setFormData({
      company: "",
      product: "",
      quantity: "",
      blockchain: "",
      origin: "",
      destination: "",
      notes: "",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Batch</CardTitle>
        <CardDescription>Create a new supply chain batch with blockchain tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select value={formData.company} onValueChange={(value) => setFormData({ ...formData, company: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blockchain">Blockchain Network</Label>
              <Select
                value={formData.blockchain}
                onValueChange={(value) => setFormData({ ...formData, blockchain: value as Batch["blockchain"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blockchain" />
                </SelectTrigger>
                <SelectContent>
                  {blockchains.map((blockchain) => (
                    <SelectItem key={blockchain} value={blockchain}>
                      {blockchain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Input
                id="product"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Enter origin location"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="Enter destination"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this batch"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            Create Batch
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
