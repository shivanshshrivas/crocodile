"use client"
// import { useChat } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, User, TrendingUp, AlertTriangle, CheckCircle, X, Loader2 } from "lucide-react"

interface AIChatPanelProps {
  isOpen: boolean
  onClose: () => void
  context?: {
    batchId?: string
    currentPage?: string
  }
}

export function AIChatPanel({ isOpen, onClose, context }: AIChatPanelProps) {
  // const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
  //   api: "/api/chat",
  //   body: { context },
  //   initialMessages: [
  //     {
  //       id: "welcome",
  //       role: "assistant",
  //       content: `Welcome to your AI Supply Chain Assistant! ${
  //         context?.batchId ? `I see you're viewing batch ${context.batchId}.` : ""
  //       } I can help you with risk analysis, performance optimization, and supply chain insights. How can I assist you today?`,
  //     },
  //   ],
  // })

  // Temporary placeholder data
  const messages = [
    {
      id: "welcome",
      role: "assistant",
      content: `Welcome to your AI Supply Chain Assistant! AI functionality is currently disabled. ${
        context?.batchId ? `You're viewing batch ${context.batchId}.` : ""
      }`,
      createdAt: new Date(),
    },
  ]
  const input = ""
  const handleInputChange = () => {}
  const handleSubmit = () => {}
  const isLoading = false
  const setInput = () => {}

  const handleQuickAction = (message: string) => {
    setInput(message)
    // Trigger form submission programmatically
    const form = document.querySelector("form") as HTMLFormElement
    if (form) {
      const submitEvent = new Event("submit", { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)
    }
  }

  const extractInsights = (content: string) => {
    // Simple insight extraction based on keywords
    const insights = []

    if (content.toLowerCase().includes("risk") || content.toLowerCase().includes("delay")) {
      insights.push({
        type: "warning" as const,
        title: "Risk Detected",
        description: "Potential supply chain risks identified in analysis",
      })
    }

    if (content.toLowerCase().includes("improve") || content.toLowerCase().includes("optimize")) {
      insights.push({
        type: "info" as const,
        title: "Optimization Opportunity",
        description: "Performance improvement suggestions available",
      })
    }

    if (content.toLowerCase().includes("efficient") || content.toLowerCase().includes("good")) {
      insights.push({
        type: "success" as const,
        title: "Performance Good",
        description: "Supply chain operations performing well",
      })
    }

    return insights
  }

  const getInsightIcon = (type: "warning" | "success" | "info") => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "info":
        return <TrendingUp className="h-4 w-4 text-blue-600" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>AI Supply Chain Assistant</CardTitle>
              <CardDescription>
                {context?.batchId ? `Analyzing batch ${context.batchId}` : "Real-time supply chain insights"}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => {
              const insights = message.role === "assistant" ? extractInsights(message.content) : []

              return (
                <div key={message.id} className="space-y-2">
                  <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        <span className="text-xs opacity-70">
                          {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>

                  {/* AI Insights */}
                  {insights.length > 0 && (
                    <div className="ml-8 space-y-2">
                      {insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-background border rounded-lg">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{insight.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {insight.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted border p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="h-3 w-3" />
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about risks, performance, or optimizations..."
                  value={input}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                </Button>
              </div>
            </form>

            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("What are the current risks in my supply chain?")}
                disabled={isLoading}
              >
                Risk Analysis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("How can I optimize my supply chain performance?")}
                disabled={isLoading}
              >
                Optimize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("Show me performance metrics and insights")}
                disabled={isLoading}
              >
                Performance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
