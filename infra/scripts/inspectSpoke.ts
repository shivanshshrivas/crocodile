import "dotenv/config";
import { createPublicClient, http, parseAbi } from "viem";
import deployments from "../deployments.json";

const abi = parseAbi([
  "function mailbox() view returns (address)",
  "function flowDomain() view returns (uint32)",
  "function hubRecipient() view returns (address)"
]);

async function main() {
  const net = process.argv[2] as "sepolia" | "polygonAmoy";
  const rpc = net === "sepolia" ? process.env.SEPOLIA_TESTNET_RPC! : process.env.AMOY_TESTNET_RPC!;
  const addr = (deployments as any)[net].SpokeRegistry as `0x${string}`;
  const c = createPublicClient({ transport: http(rpc) });

  console.log(net, "SpokeRegistry:", addr);
  console.log("mailbox:", await c.readContract({ address: addr, abi, functionName: "mailbox" }));
  console.log("flowDomain:", await c.readContract({ address: addr, abi, functionName: "flowDomain" }));
  console.log("hubRecipient:", await c.readContract({ address: addr, abi, functionName: "hubRecipient" }));
}
main();
