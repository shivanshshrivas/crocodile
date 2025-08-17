import "dotenv/config";
import {
  createPublicClient,
  http,
  parseAbi,
  decodeEventLog,
} from "viem";
import deployments from "../deployments.json";

const hubAbi = parseAbi([
  "event HubLogPushed(bytes32 indexed logId, address indexed author, bytes32 contentHash, string metadata)",
  "event OffchainReceiptRecorded(uint32 indexed origin, bytes32 indexed logId, address author)"
]);

function normalizeArg(s: string): `0x${string}` {
  const t = s.startsWith("tx=") ? s.slice(3) : s;
  return (t.startsWith("0x") ? t : `0x${t}`) as `0x${string}`;
}

async function readOne(client: any, hub: `0x${string}`, hash: `0x${string}`) {
  try {
    // Try normal receipt first
    let r = await client.getTransactionReceipt({ hash });
    // If not found, wait briefly (helps with slightly laggy RPCs)
    if (!r) {
      r = await client.waitForTransactionReceipt({
        hash,
        confirmations: 0,
        pollingInterval: 1000,
        timeout: 20_000,
      });
    }

    console.log(`\n== Flow tx: ${hash} status: ${r.status}`);
    for (const log of r.logs) {
      if (log.address.toLowerCase() !== hub.toLowerCase()) continue;
      try {
        const ev = decodeEventLog({ abi: hubAbi, data: log.data, topics: log.topics });
        console.log("  ", ev.eventName, ev.args);
      } catch {
        /* ignore non-Hub events */
      }
    }
  } catch (e: any) {
    const msg = e?.shortMessage || e?.message || String(e);
    console.warn(`\n== Flow tx: ${hash}  (skipped)  ${msg}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) throw new Error("usage: npx tsx scripts/readHubByTx.ts 0x<tx> [0x<tx> ...]");

  const rpc = process.env.FLOW_MAINNET_RPC!;
  const hub = (deployments as any).flowMainnet.HubRegistry as `0x${string}`;
  const client = createPublicClient({ transport: http(rpc) });

  const hashes = args.map(normalizeArg);
  for (const h of hashes) {
    await readOne(client, hub, h);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
