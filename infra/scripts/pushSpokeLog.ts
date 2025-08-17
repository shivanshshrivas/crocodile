import "dotenv/config";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  keccak256,
  toHex,
  encodeAbiParameters,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import deployments from "../deployments.json";

// Spoke ABI (payable because we forward the interchain fee)
const spokeAbi = parseAbi([
  "function pushSpokeLog(bytes32 logId, bytes32 contentHash, string metadata) external payable",
  "event SpokeLogPushed(bytes32 indexed logId, address indexed author, bytes32 contentHash, string metadata)"
]);

// Minimal Mailbox ABI for quoting
const mailboxAbi = parseAbi([
  "function quoteDispatch(uint32 destinationDomain, bytes32 recipient, bytes messageBody) view returns (uint256)"
]);

function addrToBytes32(addr: `0x${string}`): `0x${string}` {
  // left-pad 20-byte address to 32 bytes
  return (`0x${"0".repeat(24)}${addr.slice(2)}`) as `0x${string}`;
}

async function main() {
  const net = process.argv[2]; // "sepolia" | "polygonAmoy"
  if (!net || !["sepolia", "polygonAmoy"].includes(net)) {
    throw new Error(`usage: tsx scripts/pushSpokeLog.ts sepolia|polygonAmoy`);
  }

  // RPC & key
  const rpc =
    net === "sepolia" ? process.env.SEPOLIA_TESTNET_RPC! : process.env.AMOY_TESTNET_RPC!;
  let pk =
    net === "sepolia"
      ? process.env.SEPOLIA_TESTNET_PRIVATE_KEY
      : process.env.AMOY_TESTNET_PRIVATE_KEY;
  if (!rpc) throw new Error(`${net}: RPC not set in .env`);
  if (!pk) throw new Error(`${net}: PRIVATE_KEY not set in .env`);
  if (!pk.startsWith("0x")) pk = `0x${pk}`;
  const pkHex = pk as `0x${string}`;

  // Addresses
  const mailbox =
    net === "sepolia"
      ? (process.env.SEPOLIA_TESTNET_HYPERLANE_MAILBOX as `0x${string}`)
      : (process.env.AMOY_TESTNET_HYPERLANE_MAILBOX as `0x${string}`);
  const flowDomain = Number(process.env.FLOW_DOMAIN || "1000000747");
  const hub = process.env.FLOW_HUB_ADDRESS as `0x${string}`;
  const spoke = (deployments as any)[net]?.SpokeRegistry as `0x${string}`;

  if (!mailbox) throw new Error(`${net}: MAILBOX not set`);
  if (!hub) throw new Error(`FLOW_HUB_ADDRESS not set`);
  if (!spoke) throw new Error(`${net}: SpokeRegistry not found in deployments.json`);

  // Clients
  const account = privateKeyToAccount(pkHex);
  const pub = createPublicClient({ transport: http(rpc) });
  const wallet = createWalletClient({ account, transport: http(rpc) });

  // Build the message body (must match Hub.handle decoding)
  const logId = keccak256(toHex(`spoke-${net}-${Date.now()}`));
  const contentHash = keccak256(toHex("spoke-content"));
  const metadata = `demo:${net}`;

  const body = encodeAbiParameters(
    [
      { type: "bytes32" },
      { type: "bytes32" },
      { type: "string" },
      { type: "address" },
    ],
    [logId, contentHash, metadata, account.address]
  );

  // Quote required fee from the origin chain's Mailbox
  const fee: bigint = await pub.readContract({
    address: mailbox,
    abi: mailboxAbi,
    functionName: "quoteDispatch",
    args: [flowDomain, addrToBytes32(hub), body],
  });
  if (fee <= 0n) {
    throw new Error(`Mailbox returned zero fee — check relayer/hook config`);
  }

  // Call Spoke with value=fee; Spoke forwards msg.value to mailbox.dispatch
  const tx = await wallet.writeContract({
    address: spoke,
    abi: spokeAbi,
    functionName: "pushSpokeLog",
    args: [logId, contentHash, metadata],
    value: fee,
  });

  console.log(`${net} tx:`, tx, "(fee:", fee.toString(), ")");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
