// scripts/sendFromFlow.ts
import "dotenv/config";
import fs from "fs";
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const FLOW = { id: 545, name: "Flow EVM Testnet", network: "flow-evm-testnet",
  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
} as const;

const ABI = parseAbi([
  "function quoteSendBlock(uint32, bytes32, uint256, uint256, bytes, bool) view returns (uint256 nativeFee, uint256 lzTokenFee)",
  "function sendBlock(uint32, bytes32, uint256, uint256, bytes) payable",
]);

const EID_AMOY = Number(process.env.EID_POLYGON_AMOY || 40267);

function readDeployed(chainId: number): Record<string, string> {
  const p = `ignition/deployments/chain-${chainId}/deployed_addresses.json`;
  if (!fs.existsSync(p)) throw new Error(`Missing ${p} – deploy first.`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function toBytes32Padded(s: string): `0x${string}` {
  const hex = Buffer.from(s).toString("hex").slice(0, 64).padEnd(64, "0");
  return ("0x" + hex) as `0x${string}`;
}

async function main() {
  const flowMap = readDeployed(545);
  const flowOapp =
    (flowMap["CrocOApp#CrocOApp"] ?? flowMap["CrocOApp.oapp"]) as `0x${string}`;

  const rpc = (process.env.FLOW_EVM_RPC_URL || process.env.RPC_FLOW_EVM)!;
  const rawPk = (process.env.FLOW_EVM_PRIVATE_KEY || process.env.PRIVATE_KEY_FLOW)!;
  const pk = (rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`) as `0x${string}`;
  const account = privateKeyToAccount(pk);

  const wallet = createWalletClient({ account, chain: { ...FLOW, rpcUrls: { default: { http: [rpc] } } }, transport: http(rpc) });
  const pub = createPublicClient({ chain: { ...FLOW, rpcUrls: { default: { http: [rpc] } } }, transport: http(rpc) });

  const payloadHash = toBytes32Padded(`demo-${Date.now()}`);
  const userId = 123n;
  const workspaceId = 456n;
  const options = "0x" as `0x${string}`; // <-- rely on enforced options set via setEnforcedGas

  // quote
  const feeRes = (await pub.readContract({
    address: flowOapp,
    abi: ABI,
    functionName: "quoteSendBlock",
    args: [EID_AMOY, payloadHash, userId, workspaceId, options, false],
  })) as unknown as { nativeFee: bigint; lzTokenFee: bigint } | [bigint, bigint];

  const nativeFee = Array.isArray(feeRes) ? feeRes[0] : feeRes.nativeFee;
  const value = (nativeFee * 12n) / 10n; // +20% buffer
  console.log("quote:", nativeFee.toString(), "sending with:", value.toString());

  // send
  const tx = await wallet.writeContract({
    address: flowOapp,
    abi: ABI,
    functionName: "sendBlock",
    args: [EID_AMOY, payloadHash, userId, workspaceId, options],
    value,
  });
  console.log("send tx:", tx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
