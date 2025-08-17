// scripts/checkMailboxCode.ts
import "dotenv/config";
import { createPublicClient, http } from "viem";

async function main() {
  const rpc = process.env.FLOW_MAINNET_RPC!;
  const mailbox = process.env.FLOW_MAINNET_HYPERLANE_MAILBOX as `0x${string}`;
  const c = createPublicClient({ transport: http(rpc) });
  const code = await c.getBytecode({ address: mailbox });
  console.log("Flow Mailbox:", mailbox, "code size:", code?.length ?? 0);
}
main();
