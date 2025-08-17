import { mockBatches } from "./mock-data"
import type { Batch } from "@/types/batch"

export function getStatusStats() {
  const statusCounts = mockBatches.reduce(
    (acc, batch) => {
      acc[batch.status] = (acc[batch.status] || 0) + 1
      return acc
    },
    {} as Record<Batch["status"], number>,
  )

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    fill: getStatusColor(status as Batch["status"]),
  }))
}

export function getBlockchainStats() {
  const blockchainCounts = mockBatches.reduce(
    (acc, batch) => {
      acc[batch.blockchain] = (acc[batch.blockchain] || 0) + 1
      return acc
    },
    {} as Record<Batch["blockchain"], number>,
  )

  return Object.entries(blockchainCounts).map(([blockchain, count]) => ({
    blockchain,
    count,
    fill: getBlockchainColor(blockchain as Batch["blockchain"]),
  }))
}

export function getCompanyStats() {
  const companyData = mockBatches.reduce(
    (acc, batch) => {
      if (!acc[batch.company]) {
        acc[batch.company] = { total: 0, delivered: 0, inTransit: 0 }
      }
      acc[batch.company].total += 1
      if (batch.status === "delivered") acc[batch.company].delivered += 1
      if (batch.status === "in-transit") acc[batch.company].inTransit += 1
      return acc
    },
    {} as Record<string, { total: number; delivered: number; inTransit: number }>,
  )

  return Object.entries(companyData).map(([company, data]) => ({
    company: company.length > 15 ? company.substring(0, 15) + "..." : company,
    total: data.total,
    delivered: data.delivered,
    inTransit: data.inTransit,
  }))
}

export function getMonthlyTrends() {
  const monthlyData = mockBatches.reduce(
    (acc, batch) => {
      const month = new Date(batch.createdAt).toLocaleDateString("en-US", { month: "short" })
      if (!acc[month]) {
        acc[month] = { created: 0, delivered: 0 }
      }
      acc[month].created += 1
      if (batch.status === "delivered") {
        acc[month].delivered += 1
      }
      return acc
    },
    {} as Record<string, { created: number; delivered: number }>,
  )

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    created: data.created,
    delivered: data.delivered,
  }))
}

export function getLeadTimeStats() {
  const leadTimes = mockBatches.map((batch) => batch.leadTimeHours)
  const avgLeadTime = leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length
  const maxLeadTime = Math.max(...leadTimes)
  const minLeadTime = Math.min(...leadTimes)

  // Group by lead time ranges for distribution chart
  const ranges = [
    { range: "0-100h", min: 0, max: 100, count: 0 },
    { range: "101-200h", min: 101, max: 200, count: 0 },
    { range: "201-300h", min: 201, max: 300, count: 0 },
    { range: "301-400h", min: 301, max: 400, count: 0 },
    { range: "400h+", min: 401, max: Number.POSITIVE_INFINITY, count: 0 },
  ]

  leadTimes.forEach((time) => {
    const range = ranges.find((r) => time >= r.min && time <= r.max)
    if (range) range.count++
  })

  return {
    average: Math.round(avgLeadTime),
    max: maxLeadTime,
    min: minLeadTime,
    distribution: ranges.map((r) => ({
      range: r.range,
      count: r.count,
      fill: "hsl(var(--chart-1))",
    })),
  }
}

export function getRiskAnalysis() {
  const riskCounts = mockBatches.reduce(
    (acc, batch) => {
      acc[batch.riskLevel] = (acc[batch.riskLevel] || 0) + 1
      return acc
    },
    {} as Record<Batch["riskLevel"], number>,
  )

  const riskByCompany = mockBatches.reduce(
    (acc, batch) => {
      if (!acc[batch.currentStageCompany]) {
        acc[batch.currentStageCompany] = { low: 0, medium: 0, high: 0, total: 0 }
      }
      acc[batch.currentStageCompany][batch.riskLevel]++
      acc[batch.currentStageCompany].total++
      return acc
    },
    {} as Record<string, { low: number; medium: number; high: number; total: number }>,
  )

  return {
    overall: Object.entries(riskCounts).map(([risk, count]) => ({
      risk,
      count,
      fill: getRiskColor(risk as Batch["riskLevel"]),
    })),
    byCompany: Object.entries(riskByCompany).map(([company, data]) => ({
      company: company.length > 15 ? company.substring(0, 15) + "..." : company,
      low: data.low,
      medium: data.medium,
      high: data.high,
      riskScore: Math.round(((data.high * 3 + data.medium * 2 + data.low * 1) / data.total) * 100) / 100,
    })),
  }
}

export function getEfficiencyMetrics() {
  const completedBatches = mockBatches.filter((batch) => batch.status === "delivered" || batch.status === "verified")

  const avgLeadTimeCompleted =
    completedBatches.length > 0
      ? completedBatches.reduce((sum, batch) => sum + batch.leadTimeHours, 0) / completedBatches.length
      : 0

  const stageEfficiency = mockBatches.reduce(
    (acc, batch) => {
      const stage = batch.supplyChainStage
      if (!acc[stage]) {
        acc[stage] = { total: 0, completed: 0 }
      }
      acc[stage].total++
      if (batch.status === "delivered" || batch.status === "verified") {
        acc[stage].completed++
      }
      return acc
    },
    {} as Record<string, { total: number; completed: number }>,
  )

  return {
    completionRate: Math.round((completedBatches.length / mockBatches.length) * 100),
    avgLeadTime: Math.round(avgLeadTimeCompleted),
    stageEfficiency: Object.entries(stageEfficiency).map(([stage, data]) => ({
      stage: getStageLabel(stage),
      efficiency: Math.round((data.completed / data.total) * 100),
      total: data.total,
      completed: data.completed,
    })),
  }
}

export function getRiskPerformanceCorrelation() {
  const correlationData = mockBatches.map((batch) => ({
    riskLevel: batch.riskLevel,
    leadTime: batch.leadTimeHours,
    isCompleted: batch.status === "delivered" || batch.status === "verified",
    company: batch.currentStageCompany,
  }))

  const riskLeadTimeAvg = correlationData.reduce(
    (acc, batch) => {
      if (!acc[batch.riskLevel]) {
        acc[batch.riskLevel] = { totalLeadTime: 0, count: 0, completedCount: 0 }
      }
      acc[batch.riskLevel].totalLeadTime += batch.leadTime
      acc[batch.riskLevel].count++
      if (batch.isCompleted) acc[batch.riskLevel].completedCount++
      return acc
    },
    {} as Record<string, { totalLeadTime: number; count: number; completedCount: number }>,
  )

  return Object.entries(riskLeadTimeAvg).map(([risk, data]) => ({
    risk,
    avgLeadTime: Math.round(data.totalLeadTime / data.count),
    completionRate: Math.round((data.completedCount / data.count) * 100),
    fill: getRiskColor(risk as Batch["riskLevel"]),
  }))
}

function getStatusColor(status: Batch["status"]) {
  switch (status) {
    case "delivered":
      return "hsl(var(--chart-1))"
    case "verified":
      return "hsl(var(--chart-2))"
    case "in-transit":
      return "hsl(var(--chart-3))"
    case "pending":
      return "hsl(var(--chart-4))"
    default:
      return "hsl(var(--chart-5))"
  }
}

function getBlockchainColor(blockchain: Batch["blockchain"]) {
  switch (blockchain) {
    case "Ethereum":
      return "hsl(var(--chart-1))"
    case "Polygon":
      return "hsl(var(--chart-2))"
    case "Solana":
      return "hsl(var(--chart-3))"
    case "Hyperledger":
      return "hsl(var(--chart-4))"
    case "Binance Smart Chain":
      return "hsl(var(--chart-5))"
    default:
      return "hsl(var(--chart-1))"
  }
}

function getRiskColor(risk: Batch["riskLevel"]) {
  switch (risk) {
    case "low":
      return "hsl(var(--chart-2))"
    case "medium":
      return "hsl(var(--chart-3))"
    case "high":
      return "hsl(var(--chart-4))"
    default:
      return "hsl(var(--chart-1))"
  }
}

function getStageLabel(stage: string) {
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
