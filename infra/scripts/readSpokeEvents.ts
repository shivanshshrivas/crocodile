import "dotenv/config";
import { createPublicClient, http, parseAbi, decodeEventLog } from "viem";
import deployments from "../deployments.json";

const abi = parseAbi([
  "event SpokeLogPushed(bytes32 indexed logId, address indexed author, bytes32 contentHash, string metadata)"
]);

async function main() {
  const net = process.argv[2]; // "sepolia" | "polygonAmoy"
  if (!net || !["sepolia", "polygonAmoy"].includes(net)) throw new Error("pass sepolia|polygonAmoy");

  const rpc = net === "sepolia" ? process.env.SEPOLIA_TESTNET_RPC! : process.env.AMOY_TESTNET_RPC!;
  const address = (deployments as any)[net]?.SpokeRegistry as `0x${string}`;
  if (!rpc || !address) throw new Error("rpc/address missing");

  const client = createPublicClient({ transport: http(rpc) });
  const latest = await client.getBlockNumber();

  const logs = await client.getLogs({
    address,
    fromBlock: latest - 10_000n,
    toBlock: "latest",
  });

  for (const l of logs) {
    try {
      const parsed = decodeEventLog({ abi, data: l.data, topics: l.topics });
      console.log(net, parsed.eventName, parsed.args);
    } catch {}
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
