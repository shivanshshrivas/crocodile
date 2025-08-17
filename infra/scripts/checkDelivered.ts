import "dotenv/config";
import { createPublicClient, http, parseAbi } from "viem";

const mailboxAbi = parseAbi([
  "function delivered(bytes32 messageId) view returns (bool)"
]);

async function main() {
  const ids = process.argv.slice(2) as `0x${string}`[];
  if (ids.length === 0) throw new Error("usage: npx tsx scripts/checkDelivered.ts 0x<msgId> [...]");

  const c = createPublicClient({ transport: http(process.env.FLOW_MAINNET_RPC!) });
  const mailbox = process.env.FLOW_MAINNET_HYPERLANE_MAILBOX as `0x${string}`;

  for (const id of ids) {
    const ok = await c.readContract({ address: mailbox, abi: mailboxAbi, functionName: "delivered", args: [id] });
    console.log(id, "delivered:", ok);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
