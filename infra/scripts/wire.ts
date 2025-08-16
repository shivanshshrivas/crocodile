// scripts/wire.ts (ESM)
import "dotenv/config";
import fs from "fs";
import { createWalletClient, createPublicClient, getContract, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const FLOW = { id: 545, name: "Flow EVM Testnet", network: "flow-evm-testnet",
  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_FLOW_EVM!] } },
} as const;

const SEP   = { id: 11155111, name: "Sepolia", network: "sepolia",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_SEPOLIA!] } },
} as const;

const AMOY  = { id: 80002, name: "Polygon Amoy", network: "amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_POLYGON_AMOY!] } },
} as const;

const EID_FLOW  = Number(process.env.EID_FLOW_EVM || 40351);
const EID_SEP   = Number(process.env.EID_SEPOLIA || 40161);
const EID_AMOY  = Number(process.env.EID_POLYGON_AMOY || 40267);

const target = (process.env.TARGET || process.env.DST || process.argv.slice(2).find(a => a==="amoy"||a==="sepolia") || "amoy") as "amoy"|"sepolia";
const dst    = target === "amoy" ? AMOY : SEP;
const dstEid = target === "amoy" ? EID_AMOY : EID_SEP;

const ABI_FLOWHUB = parseAbi([
  "function setPeer(uint32 eid, bytes32 peer) external",
  "function peers(uint32) view returns (bytes32)"
]);
const ABI_SPOKE = parseAbi([
  "function setHub(uint32 srcEid, bytes32 hub) external",
  "function hubs(uint32) view returns (bytes32)"
]);

const toBytes32 = (addr: `0x${string}`) => `0x${"0".repeat(24)}${addr.slice(2)}` as `0x${string}`;
const readJson = (p: string) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,"utf8")) : null;

async function main() {
  const flowHubAddr =
    (readJson("deployments/flowhub.json")?.contractAddress as `0x${string}`) ||
    (process.env.FLOW_HUB_ADDRESS as `0x${string}`);
  if (!flowHubAddr) throw new Error("Missing FlowHub address (deployments/flowhub.json or FLOW_HUB_ADDRESS)");

  const spokeAddr = readJson(`deployments/spoke-${target}.json`)?.contractAddress as `0x${string}`;
  if (!spokeAddr) throw new Error(`Missing Spoke address (deployments/spoke-${target}.json)`);

  // FLOW client (owner key)
  const flowAcc = privateKeyToAccount(process.env.PRIVATE_KEY_FLOW as `0x${string}`);
  const flowClient = createWalletClient({ account: flowAcc, chain: FLOW, transport: http() });
  const flowPub    = createPublicClient({ chain: FLOW, transport: http() });
  const flowHub = getContract({ address: flowHubAddr, abi: ABI_FLOWHUB, client: flowClient });

  // DST client (spoke owner key)
  const dstPk = target === "amoy" ? process.env.PRIVATE_KEY_POLYGON : process.env.PRIVATE_KEY_SEPOLIA;
  const dstAcc = privateKeyToAccount(dstPk as `0x${string}`);
  const dstClient = createWalletClient({ account: dstAcc, chain: dst, transport: http() });
  const dstSpoke  = getContract({ address: spokeAddr, abi: ABI_SPOKE, client: dstClient });

  // Before
  const beforePeer = await flowPub.readContract({ address: flowHubAddr, abi: ABI_FLOWHUB, functionName: "peers", args: [dstEid] });
  const beforeHub  = await dstClient.readContract({ address: spokeAddr, abi: ABI_SPOKE, functionName: "hubs", args: [EID_FLOW] });
  console.log(`[before] FlowHub.peers[${dstEid}] = ${beforePeer}`);
  console.log(`[before] Spoke.hubs[${EID_FLOW}] = ${beforeHub}`);

  // Wire both directions
  await flowHub.write.setPeer([dstEid, toBytes32(spokeAddr)]);
  await dstSpoke.write.setHub([EID_FLOW, toBytes32(flowHubAddr)]);

  // After
  const afterPeer = await flowPub.readContract({ address: flowHubAddr, abi: ABI_FLOWHUB, functionName: "peers", args: [dstEid] });
  const afterHub  = await dstClient.readContract({ address: spokeAddr, abi: ABI_SPOKE, functionName: "hubs", args: [EID_FLOW] });
  console.log(`[after] FlowHub.peers[${dstEid}] = ${afterPeer}`);
  console.log(`[after] Spoke.hubs[${EID_FLOW}] = ${afterHub}`);

  console.log(`✅ wired ${target.toUpperCase()} <-> FLOW`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
