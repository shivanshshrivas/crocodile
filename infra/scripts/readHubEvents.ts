import "dotenv/config";
import { createPublicClient, http, parseAbi, decodeEventLog } from "viem";
import deployments from "../deployments.json";

const abi = parseAbi([
  "event HubLogPushed(bytes32 indexed logId, address indexed author, bytes32 contentHash, string metadata)",
  "event ReceiptRecorded(uint256 indexed originChainId, bytes32 indexed originTxHash)"
]);

async function main() {
  const rpc = process.env.FLOW_MAINNET_RPC!;
  const address = (deployments as any).flowMainnet?.HubRegistry as `0x${string}`;
  if (!rpc || !address) throw new Error("flowMainnet RPC/address missing");

  const client = createPublicClient({ transport: http(rpc) });
  const latest = await client.getBlockNumber();

  const logs = await client.getLogs({
    address,
    fromBlock: latest - 10_000n, // scan a recent window
    toBlock: "latest",
  });

  for (const l of logs) {
    try {
      const parsed = decodeEventLog({ abi, data: l.data, topics: l.topics });
      console.log(parsed.eventName, parsed.args);
    } catch {}
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
