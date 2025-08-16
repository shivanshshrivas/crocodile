// scripts/watchAmoy.ts
import "dotenv/config";
import fs from "fs";
import { createPublicClient, decodeEventLog, http, parseAbi } from "viem";

const AMOY = { id: 80002, name: "Polygon Amoy", network: "amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
} as const;

const ABI = parseAbi([
  "event BlockReceived(uint32 srcEid, bytes32 payloadHash, uint256 userId, uint256 workspaceId)"
]);

function readDeployed(chainId: number): Record<string, string> {
  const p = `ignition/deployments/chain-${chainId}/deployed_addresses.json`;
  if (!fs.existsSync(p)) throw new Error(`Missing ${p}`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function main() {
  const amoyMap = readDeployed(80002);
  const amoyOapp =
    (amoyMap["CrocOApp#CrocOApp"] ?? amoyMap["CrocOApp.oapp"]) as `0x${string}`;
  const rpc = (process.env.AMOY_RPC_URL || process.env.RPC_POLYGON_AMOY)!;

  const pub = createPublicClient({ chain: { ...AMOY, rpcUrls: { default: { http: [rpc] } } }, transport: http(rpc) });

  const latest = await pub.getBlockNumber();
  const from = latest > 500n ? latest - 500n : 0n;

  const logs = await pub.getLogs({ address: amoyOapp, fromBlock: from, toBlock: latest });
  for (const log of logs) {
    try {
      const ev = decodeEventLog({ abi: ABI, data: log.data, topics: log.topics });
      if (ev.eventName === "BlockReceived") console.log("BlockReceived:", ev.args);
    } catch {}
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
