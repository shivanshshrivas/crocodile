import "dotenv/config";
import { createPublicClient, http, parseAbi, decodeEventLog } from "viem";
import deployments from "../deployments.json";

const spokeAbi = parseAbi([
  "event SpokeDispatched(bytes32 indexed logId, bytes32 messageId, uint32 flowDomain, address hubRecipient)"
]);

async function main() {
  const net = process.argv[2] as "sepolia" | "polygonAmoy";
  const chunk = BigInt(process.argv[3] || "40000"); // public RPCs often limit to 50k
  if (!net || !["sepolia", "polygonAmoy"].includes(net)) {
    throw new Error(`usage: npx tsx scripts/readSpokeDispatchedPaged.ts sepolia|polygonAmoy [chunkSize]`);
  }

  const rpc = net === "sepolia" ? process.env.SEPOLIA_TESTNET_RPC! : process.env.AMOY_TESTNET_RPC!;
  const spoke = (deployments as any)[net].SpokeRegistry as `0x${string}`;
  const c = createPublicClient({ transport: http(rpc) });

  const latest = await c.getBlockNumber();
  let from = latest > chunk ? latest - chunk : 0n;

  const found: Array<{logId: `0x${string}`, messageId: `0x${string}`}> = [];

  while (from <= latest) {
    const to = from + chunk - 1n > latest ? latest : from + chunk - 1n;
    const raw = await c.getLogs({ address: spoke, fromBlock: from, toBlock: to });
    for (const l of raw) {
      try {
        const dec = decodeEventLog({ abi: spokeAbi, data: l.data, topics: l.topics });
        if (dec.eventName === "SpokeDispatched") {
          const { logId, messageId } = dec.args as any;
          found.push({ logId, messageId });
        }
      } catch {/* not our event */}
    }
    from = to + 1n;
  }

  if (found.length === 0) {
    console.log(net, "no SpokeDispatched found in last", chunk.toString(), "blocks");
    return;
  }
  for (const f of found) console.log(net, "SpokeDispatched:", f);
}
main().catch((e) => { console.error(e); process.exit(1); });
