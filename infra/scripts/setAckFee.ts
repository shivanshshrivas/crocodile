// scripts/setAckFee.ts (ESM)
import "dotenv/config";
import fs from "fs";
import { createWalletClient, http, getContract, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const ABI = parseAbi(["function setAckFeeWei(uint256 v) external", "function ackFeeWei() view returns (uint256)"]);

const target = (process.env.TARGET || process.argv.slice(2)[0] || "amoy") as "amoy"|"sepolia";
const feeStr = process.env.ACK_FEE_WEI || process.argv.slice(2)[1] || (target==="amoy" ? `${5e16}` : `${2e15}`); // default 0.05 MATIC or 0.002 ETH
const fee = BigInt(Math.floor(Number(feeStr)));

const chain = target === "amoy"
  ? { id: 80002, name: "Polygon Amoy", network: "amoy", nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 }, rpcUrls: { default: { http: [process.env.RPC_POLYGON_AMOY!] } } }
  : { id: 11155111, name: "Sepolia", network: "sepolia", nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [process.env.RPC_SEPOLIA!] } } };

const pk = target==="amoy" ? process.env.PRIVATE_KEY_POLYGON : process.env.PRIVATE_KEY_SEPOLIA;
const addr = JSON.parse(fs.readFileSync(`deployments/spoke-${target}.json`,"utf8")).contractAddress as `0x${string}`;

async function main() {
  const account = privateKeyToAccount(pk as `0x${string}`);
  const client = createWalletClient({ account, chain, transport: http() });
  const c = getContract({ address: addr, abi: ABI, client });
  const before = await client.readContract({ address: addr, abi: ABI, functionName: "ackFeeWei" });
  await c.write.setAckFeeWei([fee]);
  const after = await client.readContract({ address: addr, abi: ABI, functionName: "ackFeeWei" });
  console.log(`[${target}] ackFeeWei: ${before} -> ${after}`);
}
main().catch((e)=>{ console.error(e); process.exit(1); });
