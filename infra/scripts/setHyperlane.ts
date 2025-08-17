// scripts/setHyperlane.ts
import "dotenv/config";
import { createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import deployments from "../deployments.json";

const abi = parseAbi([
  "function setHyperlane(address _mailbox, uint32 _flowDomain, address _hubRecipient) external"
]);

async function main() {
  const net = process.argv[2]; // sepolia | polygonAmoy
  const rpc = net === "sepolia" ? process.env.SEPOLIA_TESTNET_RPC! : process.env.AMOY_TESTNET_RPC!;
  let pk = net === "sepolia" ? process.env.SEPOLIA_TESTNET_PRIVATE_KEY! : process.env.AMOY_TESTNET_PRIVATE_KEY!;
  if (!pk.startsWith("0x")) pk = `0x${pk}`;
  const wallet = createWalletClient({ account: privateKeyToAccount(pk as `0x${string}`), transport: http(rpc) });

  const spoke = (deployments as any)[net].SpokeRegistry as `0x${string}`;
  const mailbox = (net === "sepolia" ? process.env.SEPOLIA_TESTNET_HYPERLANE_MAILBOX : process.env.AMOY_TESTNET_HYPERLANE_MAILBOX) as `0x${string}`;
  const flowDomain = Number(process.env.FLOW_DOMAIN || "1000000747");
  const hub = process.env.FLOW_HUB_ADDRESS as `0x${string}`;

  const tx = await wallet.writeContract({ address: spoke, abi, functionName: "setHyperlane", args: [mailbox, flowDomain, hub] });
  console.log(`${net} setHyperlane tx:`, tx);
}
main();
