export interface Batch {
  id: string
  company: string
  product: string
  quantity: number
  status: "pending" | "in-transit" | "delivered" | "verified"
  blockchain: "Ethereum" | "Polygon" | "Solana" | "Hyperledger" | "Binance Smart Chain"
  createdAt: string
  lastUpdated: string
  origin: string
  destination: string
  transactionHash?: string
  // New fields for supply chain progression
  supplyChainStage: "raw-material" | "processing" | "manufacturing" | "finished-product"
  currentStageCompany: string
  chainProgression: ChainStage[]
  leadTimeHours: number
  riskLevel: "low" | "medium" | "high"
}

export interface ChainStage {
  company: string
  stage: "raw-material" | "processing" | "manufacturing" | "finished-product"
  blockchain: "Ethereum" | "Polygon" | "Solana" | "Hyperledger" | "Binance Smart Chain"
  location: string
  completedAt?: string
  transactionHash?: string
  status: "completed" | "in-progress" | "pending"
}
