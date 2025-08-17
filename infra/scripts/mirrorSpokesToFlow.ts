import "dotenv/config";
import {
  createPublicClient, createWalletClient, http,
  parseAbi, decodeEventLog
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import deployments from "../deployments.json";
import { promises as fs } from "fs";

type Net = "sepolia" | "polygonAmoy";
const ORIGIN: Record<Net, number> = { sepolia: 11155111, polygonAmoy: 80002 };
const CHECKPOINT_PATH = "./.mirror-state.json"; // persisted last processed block per chain
const CHUNK = 40_000n; // many public RPCs limit to 50k

const spokeAbi = parseAbi([
  "event SpokeLogPushed(bytes32 indexed logId, address indexed author, bytes32 contentHash, string metadata)"
]);

const hubAbi = parseAbi([
  "function hasOffchainReceipt(uint32 origin, bytes32 logId) view returns (bool)",
  "function recordReceiptFromOffchain(uint32 origin, bytes32 logId, bytes32 contentHash, string metadata, address author) external"
]);

async function loadCheckpoint() {
  try { return JSON.parse(await fs.readFile(CHECKPOINT_PATH, "utf8")); }
  catch { return { sepolia: 0, polygonAmoy: 0 }; }
}
async function saveCheckpoint(cp: any) {
  await fs.writeFile(CHECKPOINT_PATH, JSON.stringify(cp, null, 2));
}

function rpcOf(net: Net) {
  return net === "sepolia"
    ? process.env.SEPOLIA_TESTNET_RPC!
    : process.env.AMOY_TESTNET_RPC!;
}

async function mirrorOne(net: Net) {
  const spoke = (deployments as any)[net].SpokeRegistry as `0x${string}`;
  const rpc = rpcOf(net);
  const pub = createPublicClient({ transport: http(rpc) });

  const flowHub = (deployments as any).flowMainnet.HubRegistry as `0x${string}`;
  const flowRpc = process.env.FLOW_MAINNET_RPC!;
  let pk = process.env.FLOW_MAINNET_PRIVATE_KEY!;
  if (!pk.startsWith("0x")) pk = `0x${pk}`;
  const wallet = createWalletClient({
    account: privateKeyToAccount(pk as `0x${string}`),
    transport: http(flowRpc)
  });
  const flowPub = createPublicClient({ transport: http(flowRpc) });

  const cp = await loadCheckpoint();
  const latest = await pub.getBlockNumber();
  let from = cp[net] ? BigInt(cp[net]) : (latest > CHUNK ? (latest - CHUNK) : 0n);

  while (from <= latest) {
    const to = (from + CHUNK - 1n > latest) ? latest : (from + CHUNK - 1n);

    const logs = await pub.getLogs({ address: spoke, fromBlock: from, toBlock: to });
    for (const l of logs) {
      try {
        const ev = decodeEventLog({ abi: spokeAbi, data: l.data, topics: l.topics });
        if (ev.eventName !== "SpokeLogPushed") continue;

        const { logId, author, contentHash, metadata } = ev.args as any;

        // skip if already mirrored
        const already = await flowPub.readContract({
          address: flowHub,
          abi: hubAbi,
          functionName: "hasOffchainReceipt",
          args: [ORIGIN[net], logId],
        });
        if (already) continue;

        // write to Hub
        const tx = await wallet.writeContract({
          address: flowHub,
          abi: hubAbi,
          functionName: "recordReceiptFromOffchain",
          args: [ORIGIN[net], logId, contentHash, metadata, author],
        });
        console.log(`[${net}] mirrored logId=${logId} -> Flow tx=${tx}`);
      } catch { /* skip non-matching logs */ }
    }

    from = to + 1n;
    cp[net] = Number(from);
    await saveCheckpoint(cp);
  }
}

async function main() {
  await mirrorOne("sepolia");
  await mirrorOne("polygonAmoy");
}
main().catch((e) => { console.error(e); process.exit(1); });
