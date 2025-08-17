"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AIChatPanel } from "@/components/ai-chat-panel"
import { AIInsightsWidget } from "@/components/ai-insights-widget"
import {
  getStatusStats,
  getBlockchainStats,
  getCompanyStats,
  getMonthlyTrends,
  getLeadTimeStats,
  getRiskAnalysis,
  getEfficiencyMetrics,
  getRiskPerformanceCorrelation,
} from "@/lib/stats-data"
import { mockBatches } from "@/lib/mock-data"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ScatterChart, Scatter } from "recharts"
import { MessageSquare } from "lucide-react"

const statusData = getStatusStats()
const blockchainData = getBlockchainStats()
const companyData = getCompanyStats()
const monthlyData = getMonthlyTrends()
const leadTimeData = getLeadTimeStats()
const riskData = getRiskAnalysis()
const efficiencyData = getEfficiencyMetrics()
const correlationData = getRiskPerformanceCorrelation()

const chartConfig = {
  delivered: {
    label: "Delivered",
    color: "hsl(var(--chart-1))",
  },
  verified: {
    label: "Verified",
    color: "hsl(var(--chart-2))",
  },
  "in-transit": {
    label: "In Transit",
    color: "hsl(var(--chart-3))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-4))",
  },
  total: {
    label: "Total Batches",
    color: "hsl(var(--chart-1))",
  },
  inTransit: {
    label: "In Transit",
    color: "hsl(var(--chart-3))",
  },
  created: {
    label: "Created",
    color: "hsl(var(--chart-1))",
  },
  low: {
    label: "Low Risk",
    color: "hsl(var(--chart-2))",
  },
  medium: {
    label: "Medium Risk",
    color: "hsl(var(--chart-3))",
  },
  high: {
    label: "High Risk",
    color: "hsl(var(--chart-4))",
  },
}

export default function StatsPage() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  const totalBatches = mockBatches.length
  const totalQuantity = mockBatches.reduce((sum, batch) => sum + batch.quantity, 0)
  const uniqueCompanies = new Set(mockBatches.map((batch) => batch.currentStageCompany)).size
  const uniqueBlockchains = new Set(mockBatches.map((batch) => batch.blockchain)).size

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-6 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Supply Chain Analytics</h1>
                <p className="text-muted-foreground">
                  Comprehensive insights including lead time analysis and risk assessment across your wood-to-chair
                  supply chain
                </p>
              </div>
              <Button onClick={() => setIsChatOpen(true)} className="gap-2">
                <MessageSquare className="h-4 w-4" />
                AI Assistant
              </Button>
            </div>

            <AIInsightsWidget />

            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalBatches}</div>
                  <p className="text-xs text-muted-foreground">Wood to chair</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Wood logs</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Supply Partners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uniqueCompanies}</div>
                  <p className="text-xs text-muted-foreground">Active companies</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Lead Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{leadTimeData.average}h</div>
                  <p className="text-xs text-muted-foreground">{Math.round(leadTimeData.average / 24)} days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{efficiencyData.completionRate}%</div>
                  <p className="text-xs text-muted-foreground">Delivered/verified</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Blockchains</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uniqueBlockchains}</div>
                  <p className="text-xs text-muted-foreground">Networks used</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Time Distribution</CardTitle>
                  <CardDescription>Distribution of batch lead times across supply chain</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={leadTimeData.distribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--chart-1))" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Level Distribution</CardTitle>
                  <CardDescription>Overall risk assessment across all batches</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={riskData.overall}
                        dataKey="count"
                        nameKey="risk"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ risk, count }) => `${risk}: ${count}`}
                      >
                        {riskData.overall.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Company Risk Analysis</CardTitle>
                  <CardDescription>Risk levels by supply chain partner</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={riskData.byCompany}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="company" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="low" stackId="risk" fill="hsl(var(--chart-2))" name="Low Risk" />
                      <Bar dataKey="medium" stackId="risk" fill="hsl(var(--chart-3))" name="Medium Risk" />
                      <Bar dataKey="high" stackId="risk" fill="hsl(var(--chart-4))" name="High Risk" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} context={{ currentPage: "stats" }} />
    </div>
  )
}

