import "dotenv/config";
import { createWalletClient, http, parseAbi, keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import deployments from "../deployments.json";

const abi = parseAbi([
  "function pushSpokeLog(bytes32 logId, bytes32 contentHash, string metadata) external",
  "event SpokeLogPushed(bytes32 indexed logId, address indexed author, bytes32 contentHash, string metadata)"
]);

async function main() {
  const net = process.argv[2]; // "sepolia" | "polygonAmoy"
  if (!net || !["sepolia", "polygonAmoy"].includes(net)) {
    throw new Error(`pass network: node scripts/pushSpokeLog.js sepolia`);
  }

  const rpc = net === "sepolia" ? process.env.SEPOLIA_TESTNET_RPC : process.env.AMOY_TESTNET_RPC;
  let pk = net === "sepolia" ? process.env.SEPOLIA_TESTNET_PRIVATE_KEY : process.env.AMOY_TESTNET_PRIVATE_KEY;
  const spoke = (deployments as any)[net]?.SpokeRegistry as `0x${string}` | undefined;

  if (!rpc) throw new Error(`${net}: RPC not set in .env`);
  if (!pk) throw new Error(`${net}: PRIVATE_KEY not set in .env`);
  if (!spoke) throw new Error(`${net}: SpokeRegistry not found in deployments.json`);

  if (!pk.startsWith("0x")) pk = `0x${pk}`;
  const pkHex = pk as `0x${string}`;

  const account = privateKeyToAccount(pkHex);
  const client = createWalletClient({ account, transport: http(rpc) });

  const logId = keccak256(toHex(`spoke-${net}-${Date.now()}`));
  const contentHash = keccak256(toHex("spoke-content"));
  const metadata = `demo:${net}`;

  const tx = await client.writeContract({
    address: spoke,
    abi,
    functionName: "pushSpokeLog",
  args: [logId, contentHash, metadata],
  chain: undefined
  });

  console.log(`${net} tx:`, tx);
}

main().catch((e) => { console.error(e); process.exit(1); });
