export const EIDS = {
  FLOW_EVM_TESTNET: Number(process.env.EID_FLOW_EVM || 40351),
  SEPOLIA: Number(process.env.EID_SEPOLIA || 40161),
  POLYGON_AMOY: Number(process.env.EID_POLYGON_AMOY || 40267),
} as const;

export const LZ_ENDPOINTS: Record<number, `0x${string}`> = {
  [EIDS.FLOW_EVM_TESTNET]: (process.env.LZ_ENDPOINT_FLOW_EVM as `0x${string}`)!,
  [EIDS.SEPOLIA]: (process.env.LZ_ENDPOINT_SEPOLIA as `0x${string}`)!,
  [EIDS.POLYGON_AMOY]: (process.env.LZ_ENDPOINT_POLYGON_AMOY as `0x${string}`)!,
};
