// scripts/wireAmoy.ts
import "dotenv/config";
import fs from "fs";
import { createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const AMOY = {
  id: 80002,
  name: "Polygon Amoy",
  network: "amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
} as const;

const ABI = parseAbi([
  "function setPeer(uint32 eid, bytes32 peer) external",
  "function setEnforcedGas(uint32 eid, uint128 gas) external",
]);

const EID_FLOW = Number(process.env.EID_FLOW_EVM || 40351);

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

  const rpc = (process.env.AMOY_RPC_URL || process.env.RPC_POLYGON_AMOY)!;
  const rawPk = (process.env.AMOY_PRIVATE_KEY || process.env.PRIVATE_KEY_POLYGON)!;
  const pk = (rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`) as `0x${string}`;
  const account = privateKeyToAccount(pk);
  const client = createWalletClient({ account, chain: { ...AMOY, rpcUrls: { default: { http: [rpc] } } }, transport: http(rpc) });

  console.log("Amoy OApp:", amoyOapp, "→ setPeer(Flow):", flowOapp);
  const tx1 = await client.writeContract({
    address: amoyOapp,
    abi: ABI,
    functionName: "setPeer",
    args: [EID_FLOW, toB32(flowOapp)],
  });
  console.log("setPeer tx:", tx1);

  console.log("setEnforcedGas(Flow, 200k)");
  const tx2 = await client.writeContract({
    address: amoyOapp,
    abi: ABI,
    functionName: "setEnforcedGas",
    args: [EID_FLOW, 200_000n],
  });
  console.log("setEnforcedGas tx:", tx2);

  console.log("✅ Amoy side wired.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
