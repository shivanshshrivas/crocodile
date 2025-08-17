import "dotenv/config";
import { createPublicClient, http, parseAbi } from "viem";
import deployments from "../deployments.json";

const hubAbi = parseAbi([
  "function mailbox() view returns (address)",
  "function admin() view returns (address)"
]);

async function main() {
  const rpc = process.env.FLOW_MAINNET_RPC!;
  const hub = (deployments as any).flowMainnet?.HubRegistry as `0x${string}`;

  if (!rpc) throw new Error("FLOW_MAINNET_RPC is not set in .env");
  if (!hub) throw new Error("flowMainnet.HubRegistry not found in deployments.json");

  const c = createPublicClient({ transport: http(rpc) });

  // Optional: confirm there is code at the address
  const code = await c.getBytecode({ address: hub });
  console.log("HubRegistry:", hub, `(code size: ${code ? code.length : 0})`);

  const [mailbox, admin] = await Promise.all([
    c.readContract({ address: hub, abi: hubAbi, functionName: "mailbox" }),
    c.readContract({ address: hub, abi: hubAbi, functionName: "admin" }),
  ]);

  console.log("mailbox:", mailbox);
  console.log("admin  :", admin);

  // Optional: compare with your env var for a quick sanity check
  const envMailbox = (process.env.FLOW_MAINNET_HYPERLANE_MAILBOX || "").toLowerCase();
  if (envMailbox) {
    console.log(
      "mailbox matches env:",
      mailbox.toLowerCase() === envMailbox ? "✓" : `✗ (env has ${process.env.FLOW_MAINNET_HYPERLANE_MAILBOX})`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
