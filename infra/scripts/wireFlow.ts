// scripts/wireFlow.ts
import "dotenv/config";
import fs from "fs";
import { createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const FLOW = {
  id: 545,
  name: "Flow EVM Testnet",
  network: "flow-evm-testnet",
  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
} as const;

const ABI = parseAbi([
  "function setPeer(uint32 eid, bytes32 peer) external",
  "function setEnforcedGas(uint32 eid, uint128 gas) external",
]);

const EID_AMOY = Number(process.env.EID_POLYGON_AMOY || 40267);

const toB32 = (addr: `0x${string}`) =>
  (`0x${"0".repeat(24)}${addr.slice(2).toLowerCase()}`) as `0x${string}`;

function readDeployed(chainId: number): Record<string, string> {
  const p = `ignition/deployments/chain-${chainId}/deployed_addresses.json`;
  if (!fs.existsSync(p)) throw new Error(`Missing ${p} – deploy first.`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function main() {
  const flowMap = readDeployed(545);
  const amoyMap = readDeployed(80002);

  const flowOapp =
    (flowMap["CrocOApp#CrocOApp"] ?? flowMap["CrocOApp.oapp"]) as `0x${string}`;
  const amoyOapp =
    (amoyMap["CrocOApp#CrocOApp"] ?? amoyMap["CrocOApp.oapp"]) as `0x${string}`;

  if (!flowOapp || !amoyOapp) throw new Error("Missing deployed OApp addresses from Ignition.");

  const rpc = (process.env.FLOW_EVM_RPC_URL || process.env.RPC_FLOW_EVM)!;
  const rawPk = (process.env.FLOW_EVM_PRIVATE_KEY || process.env.PRIVATE_KEY_FLOW)!;
  const pk = (rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`) as `0x${string}`;
  const account = privateKeyToAccount(pk);
  const client = createWalletClient({ account, chain: { ...FLOW, rpcUrls: { default: { http: [rpc] } } }, transport: http(rpc) });

  console.log("Flow OApp:", flowOapp, "→ setPeer(Amoy):", amoyOapp);
  const tx1 = await client.writeContract({
    address: flowOapp,
    abi: ABI,
    functionName: "setPeer",
    args: [EID_AMOY, toB32(amoyOapp)],
  });
  console.log("setPeer tx:", tx1);

  console.log("setEnforcedGas(Amoy, 200k)");
  const tx2 = await client.writeContract({
    address: flowOapp,
    abi: ABI,
    functionName: "setEnforcedGas",
    args: [EID_AMOY, 200_000n],
  });
  console.log("setEnforcedGas tx:", tx2);

  console.log("✅ Flow side wired.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
