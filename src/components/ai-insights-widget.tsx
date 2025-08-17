"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react"

interface AIInsight {
  id: string
  type: "optimization" | "risk" | "performance" | "prediction"
  title: string
  description: string
  confidence: number
  impact: "high" | "medium" | "low"
  actionable: boolean
}

export function AIInsightsWidget() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const generateInsights = async () => {
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context: "supply_chain_dashboard",
          request: "Generate actionable insights for wood-to-chair supply chain operations",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
      } else {
        setInsights(getMockInsights())
      }
    } catch (error) {
      console.error("Error generating insights:", error)
      setInsights(getMockInsights())
    }
  }

  const getMockInsights = (): AIInsight[] => [
    {
      id: "1",
      type: "optimization",
      title: "Parallel Processing Opportunity",
      description:
        "Portland Lumber Mill could reduce lead time by 12 hours using parallel processing for batches >500 units",
      confidence: 87,
      impact: "high",
      actionable: true,
    },
    {
      id: "2",
      type: "risk",
      title: "Weather Impact Alert",
      description: "Forest Timber Co. operations may be delayed 24-48 hours due to predicted severe weather",
      confidence: 92,
      impact: "medium",
      actionable: true,
    },
    {
      id: "3",
      type: "performance",
      title: "Cross-Chain Efficiency Gain",
      description: "Ethereum-Polygon bridge operations are 23% faster than previous quarter average",
      confidence: 95,
      impact: "medium",
      actionable: false,
    },
    {
      id: "4",
      type: "prediction",
      title: "Demand Forecast",
      description: "Chair demand expected to increase 15% next month based on seasonal patterns and market trends",
      confidence: 78,
      impact: "high",
      actionable: true,
    },
  ]

  useEffect(() => {
    const loadInsights = async () => {
      setIsLoading(true)
      await generateInsights()
      setIsLoading(false)
    }
    loadInsights()
  }, [])

  const refreshInsights = async () => {
    setIsRefreshing(true)
    await generateInsights()
    setIsRefreshing(false)
  }

  const getTypeIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "optimization":
        return <Lightbulb className="h-4 w-4 text-yellow-600" />
      case "risk":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "performance":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "prediction":
        return <Brain className="h-4 w-4 text-blue-600" />
    }
  }

  const getImpactColor = (impact: AIInsight["impact"]) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>Real-time supply chain intelligence and recommendations</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshInsights}
            disabled={isRefreshing || isLoading}
            className="gap-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing || isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Generating AI insights...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="flex items-start gap-3 p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-2">{getTypeIcon(insight.type)}</div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <Badge className={getImpactColor(insight.impact)} variant="secondary">
                      {insight.impact} impact
                    </Badge>
                    {insight.actionable && (
                      <Badge variant="outline" className="text-xs">
                        Actionable
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">{insight.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${insight.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{Math.round(insight.confidence)}%</span>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-xs capitalize">
                      {insight.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
