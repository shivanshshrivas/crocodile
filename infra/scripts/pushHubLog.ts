import { createPublicClient, createWalletClient, http, parseAbi, keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import deployments from "../deployments.json";

const abi = parseAbi([
  "function pushHubLog(bytes32 logId, bytes32 contentHash, string metadata) external",
  "event HubLogPushed(bytes32 indexed logId, address indexed author, bytes32 contentHash, string metadata)"
]);

async function main() {
  const rpc = process.env.FLOW_MAINNET_RPC!;
  const pk  = process.env.FLOW_MAINNET_PRIVATE_KEY! as `0x${string}`;
  const hub = (deployments as any).flowMainnet.HubRegistry as `0x${string}`;

  const account = privateKeyToAccount(pk);
  const client = createWalletClient({ account, transport: http(rpc) });

  const logId = keccak256(toHex(`demo-${Date.now()}`));
  const contentHash = keccak256(toHex("hello-world"));
  const metadata = "demo:hub";

  const hash = await client.writeContract({
    address: hub,
    abi,
    functionName: "pushHubLog",
    args: [logId, contentHash, metadata],
  });

  console.log("tx:", hash);
}

main().catch((e) => { console.error(e); process.exit(1); });
