// import { streamText } from "ai"
// import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    const { context, request } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        insights: [
          {
            id: "config_required",
            type: "optimization",
            title: "Configure OpenAI API Key",
            description:
              "Add OPENAI_API_KEY to environment variables to enable AI-powered supply chain insights and recommendations.",
            confidence: 100,
            impact: "high",
            actionable: true,
          },
          {
            id: "demo_insight",
            type: "performance",
            title: "Supply Chain Overview",
            description:
              "Your wood-to-chair supply chain spans three companies using different blockchain networks for transparency and tracking.",
            confidence: 95,
            impact: "medium",
            actionable: false,
          },
        ],
      })
    }

    const systemPrompt = `You are an AI assistant specialized in supply chain analytics. Generate 3-4 actionable insights for a wood-to-chair supply chain with these companies:
    - Forest Timber Co. (raw materials, Hyperledger)
    - Portland Lumber Mill (processing, Ethereum) 
    - Craftsman Furniture (manufacturing, Polygon)

    Return insights as JSON array with this structure:
    {
      "insights": [
        {
          "id": "unique_id",
          "type": "optimization|risk|performance|prediction",
          "title": "Brief title",
          "description": "Detailed actionable description",
          "confidence": 70-95,
          "impact": "high|medium|low",
          "actionable": true|false
        }
      ]
    }

    Focus on realistic supply chain scenarios like lead times, weather impacts, blockchain efficiency, demand forecasting, and operational optimizations.`

    // const result = await streamText({
    //   model: openai("gpt-4o"),
    //   system: systemPrompt,
    //   prompt: request,
    //   maxTokens: 800,
    //   temperature: 0.7,
    // })

    // const fullText = await result.text

    // try {
    //   const parsed = JSON.parse(fullText)
    //   return Response.json(parsed)
    // } catch {
      // Fallback if JSON parsing fails
      return Response.json({
        insights: [
          {
            id: "fallback_1",
            type: "performance",
            title: "AI Disabled",
            description: "AI insights are currently disabled. Wallet functionality is available for blockchain operations.",
            confidence: 100,
            impact: "medium",
            actionable: false,
          },
        ],
      })
    // }
  } catch (error) {
    console.error("Insights API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

