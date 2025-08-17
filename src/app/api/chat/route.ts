// import { streamText } from "ai"
// import { openai } from "@ai-sdk/openai"
import { createClient } from "../../../src/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        error: "OpenAI API key not configured",
        fallback:
          "I'm a supply chain AI assistant. Please configure the OPENAI_API_KEY environment variable to enable full AI functionality. For now, I can help you understand that your wood-to-chair supply chain involves Forest Timber Co., Portland Lumber Mill, and Craftsman Furniture using different blockchain networks.",
      })
    }

    // Get user context from Supabase
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Build system prompt with supply chain context
    const systemPrompt = `You are an AI assistant specialized in supply chain management and blockchain tracking. You help users analyze their wood-to-chair supply chain operations.

Current Supply Chain Context:
- Three companies: Forest Timber Co. (raw materials, Hyperledger), Portland Lumber Mill (processing, Ethereum), Craftsman Furniture (manufacturing, Polygon)
- Blockchain networks: Hyperledger Fabric, Ethereum, Polygon
- Key metrics: Lead time, risk levels, batch status, cross-chain operations

${context?.batchId ? `Currently analyzing batch: ${context.batchId}` : ""}
${context?.currentPage ? `User is on page: ${context.currentPage}` : ""}

Provide actionable insights about:
- Risk analysis and mitigation
- Performance optimization
- Supply chain efficiency
- Blockchain network status
- Lead time improvements
- Company-specific recommendations

Keep responses concise, practical, and focused on supply chain operations. Include specific metrics when possible.`

    // const result = await streamText({
    //   model: openai("gpt-4o"),
    //   system: systemPrompt,
    //   messages,
    //   maxTokens: 500,
    //   temperature: 0.7,
    // })

    // return result.toDataStreamResponse()
    
    return Response.json({
      content: "AI chat is currently disabled. Wallet functionality is available.",
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

