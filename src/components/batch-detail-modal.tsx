"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
  MessageSquare,
  BarChart3,
  Hash,
  Shield,
  FileText,
  Calendar,
} from "lucide-react"
import type { Batch, ChainStage } from "@/types/batch"

interface BatchDetailModalProps {
  batch: Batch | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface BlockchainEvent {
  id: string
  sourceHash: string
  risk: "low" | "medium" | "high"
  manifest: string
  timestamp: string
  type: "transfer" | "verification" | "update"
}

const mockEvents: BlockchainEvent[] = [
  {
    id: "1",
    sourceHash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
    risk: "low",
    manifest: "Raw wood material verified and logged",
    timestamp: "2024-01-15T10:30:00Z",
    type: "verification",
  },
  {
    id: "2",
    sourceHash: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234",
    risk: "medium",
    manifest: "Processing stage initiated - quality check pending",
    timestamp: "2024-01-16T14:20:00Z",
    type: "update",
  },
  {
    id: "3",
    sourceHash: "0x3c4d5e6f7890abcdef1234567890abcdef123456",
    risk: "low",
    manifest: "Transfer to manufacturing facility completed",
    timestamp: "2024-01-17T09:15:00Z",
    type: "transfer",
  },
]

const getStatusIcon = (status: ChainStage["status"]) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "in-progress":
      return <Clock className="h-4 w-4 text-blue-600" />
    case "pending":
      return <AlertCircle className="h-4 w-4 text-gray-400" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />
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

const getRiskColor = (risk: Batch["riskLevel"] | BlockchainEvent["risk"]) => {
  switch (risk) {
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
}

const getStageLabel = (stage: ChainStage["stage"]) => {
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

const getEventTypeIcon = (type: BlockchainEvent["type"]) => {
  switch (type) {
    case "verification":
      return <Shield className="h-4 w-4 text-green-600" />
    case "transfer":
      return <ArrowRight className="h-4 w-4 text-blue-600" />
    case "update":
      return <FileText className="h-4 w-4 text-orange-600" />
    default:
      return <FileText className="h-4 w-4 text-gray-600" />
  }
}

export function BatchDetailModal({ batch, open, onOpenChange }: BatchDetailModalProps) {
  const [newEventData, setNewEventData] = useState({ type: "", description: "" })
  const [chatMessage, setChatMessage] = useState("")
  const [chatHistory, setChatHistory] = useState([
    { role: "assistant", message: "Hello! I'm your supply chain AI assistant. How can I help you with this batch?" },
  ])

  if (!batch) return null

  const handleLogEvent = () => {
    // Handle logging new event
    console.log("Logging event:", newEventData)
    setNewEventData({ type: "", description: "" })
  }

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return

    setChatHistory([
      ...chatHistory,
      { role: "user", message: chatMessage },
      {
        role: "assistant",
        message: `Based on batch ${batch.id}, I can see this is a ${batch.product} shipment with ${batch.riskLevel} risk level. The current stage is ${getStageLabel(batch.supplyChainStage)}. How can I assist you further?`,
      },
    ])
    setChatMessage("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Batch Details: {batch.id}
            <Badge className={getRiskColor(batch.riskLevel)}>{batch.riskLevel} risk</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-[calc(90vh-120px)]">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="chain">Chain Path</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Batch Information</CardTitle>
                      <Button className="gap-2" onClick={handleLogEvent}>
                        <Plus className="h-4 w-4" />
                        Log Event
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Product:</span> {batch.product}
                        </p>
                        <p>
                          <span className="font-medium">Quantity:</span> {batch.quantity.toLocaleString()}
                        </p>
                        <p>
                          <span className="font-medium">Current Stage:</span> {getStageLabel(batch.supplyChainStage)}
                        </p>
                        <p>
                          <span className="font-medium">Current Company:</span> {batch.currentStageCompany}
                        </p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Created:</span> {new Date(batch.createdAt).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-medium">Last Updated:</span>{" "}
                          {new Date(batch.lastUpdated).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-medium">Lead Time:</span> {batch.leadTimeHours}h (
                          {Math.round(batch.leadTimeHours / 24)}d)
                        </p>
                        <p>
                          <span className="font-medium">Risk Level:</span>{" "}
                          <Badge className={`ml-2 ${getRiskColor(batch.riskLevel)}`}>{batch.riskLevel}</Badge>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Log Event Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Log New Event</CardTitle>
                    <CardDescription>Add a new event to the blockchain</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="event-type">Event Type</Label>
                        <Input
                          id="event-type"
                          placeholder="e.g., Quality Check, Transfer"
                          value={newEventData.type}
                          onChange={(e) => setNewEventData({ ...newEventData, type: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-description">Description</Label>
                        <Textarea
                          id="event-description"
                          placeholder="Describe the event..."
                          value={newEventData.description}
                          onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chain" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowRight className="h-5 w-5" />
                      Interoperability Chain Flow
                    </CardTitle>
                    <CardDescription>Visual representation of cross-chain supply chain progression</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {batch.chainProgression.map((stage, index) => (
                        <div key={index} className="relative">
                          <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(stage.status)}
                              <span className="font-medium">{stage.company}</span>
                            </div>

                            <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="font-medium">{getStageLabel(stage.stage)}</p>
                                <p className="text-muted-foreground">{stage.location}</p>
                              </div>
                              <div>
                                <Badge className={getBlockchainColor(stage.blockchain)}>{stage.blockchain}</Badge>
                                {stage.transactionHash && (
                                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                                    {stage.transactionHash.slice(0, 10)}...
                                  </p>
                                )}
                              </div>
                              <div>
                                {stage.completedAt ? (
                                  <p className="text-green-600 font-medium text-xs">
                                    ✓ {new Date(stage.completedAt).toLocaleDateString()}
                                  </p>
                                ) : (
                                  <p className="text-muted-foreground text-xs">
                                    {stage.status === "in-progress" ? "🔄 In Progress" : "⏳ Pending"}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Cross-chain Bridge</div>
                                <div className="text-xs font-mono">
                                  {index < batch.chainProgression.length - 1 ? "🔗 Active" : "🏁 Final"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {index < batch.chainProgression.length - 1 && (
                            <div className="flex justify-center py-2">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ArrowRight className="h-4 w-4" />
                                <span>Cross-chain Transfer</span>
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      Blockchain Events Dashboard
                    </CardTitle>
                    <CardDescription>Polygon network flow events and transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockEvents.map((event) => (
                        <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className="flex items-center gap-2">
                            {getEventTypeIcon(event.type)}
                            <Badge className={getRiskColor(event.risk)}>{event.risk}</Badge>
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Hash className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono text-xs">{event.sourceHash}</span>
                            </div>
                            <p className="text-sm">{event.manifest}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(event.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Processing Efficiency</span>
                          <span className="font-medium">87%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: "87%" }}></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Risk Score</span>
                          <span className="font-medium">23/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "23%" }}></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Chain Verification</span>
                          <span className="font-medium">100%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: "100%" }}></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Timeline Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Expected Duration</span>
                          <span className="font-medium">120 hours</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Actual Duration</span>
                          <span className="font-medium">{batch.leadTimeHours} hours</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Variance</span>
                          <span
                            className={`font-medium ${batch.leadTimeHours > 120 ? "text-red-600" : "text-green-600"}`}
                          >
                            {batch.leadTimeHours > 120 ? "+" : ""}
                            {batch.leadTimeHours - 120}h
                          </span>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            AI Insight: This batch is performing {batch.leadTimeHours > 120 ? "slower" : "faster"} than
                            expected. Consider optimizing the {getStageLabel(batch.supplyChainStage).toLowerCase()}{" "}
                            stage.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="w-80 border-l bg-muted/30">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                AI Assistant
              </h3>
              <p className="text-xs text-muted-foreground">Contextual supply chain insights</p>
            </div>

            <div className="flex flex-col h-[calc(100%-80px)]">
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {chatHistory.map((chat, index) => (
                  <div key={index} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        chat.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border"
                      }`}
                    >
                      {chat.message}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about this batch..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button size="sm" onClick={handleSendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
