import { createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";
import { EIDS, LZ_ENDPOINTS } from "../utils/constants";
import fs from "fs";
import path from "path";

dotenv.config();

const FLOW_EVM = {
  id: 545, // Flow EVM testnet chain id (RPC expects 545)
  name: "Flow EVM Testnet",
  network: "flow-evm-testnet",
  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_FLOW_EVM!] } },
};

const FlowHubAbi = parseAbi([
  "function owner() view returns (address)",
  "constructor(address _endpoint, uint32 _flowEid)",
  "function setPeer(uint32 eid, bytes32 peer) external",
  "function registerCompany(uint256, address, bool, uint32, string) external",
]);

async function main() {
  // Validate and normalize environment variables
  const rawPk = process.env.PRIVATE_KEY_FLOW ?? process.env.PRIVATE_KEY;
  if (!rawPk) {
    console.error("Missing PRIVATE_KEY (or PRIVATE_KEY_FLOW) in environment. Set it in .env before running this script.");
    process.exit(1);
  }
  const pk = rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`;

  const rpc = process.env.RPC_FLOW_EVM;
  if (!rpc) {
    console.error("Missing RPC_FLOW_EVM in environment. Set it in .env before running this script.");
    process.exit(1);
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  const client = createWalletClient({ account, chain: { ...FLOW_EVM, rpcUrls: { default: { http: [rpc] } } }, transport: http() });

  const imported = await import("../artifacts/contracts/FlowHub.sol/FlowHub.json");
  const bytecode = imported.default.bytecode as `0x${string}`;
  const abi = imported.default.abi as any;

  // Idempotent deployment: if already deployed, print and exit
  const outDir = path.resolve(process.cwd(), "deployments");
  const outFile = path.join(outDir, "flowhub.json");
  if (fs.existsSync(outFile)) {
    const prev = JSON.parse(fs.readFileSync(outFile, "utf8"));
    console.log("FlowHub already deployed:", prev);
    return;
  }

  console.log("Deploying FlowHub to", rpc, "using account", account.address);
  const hash = await client.deployContract({
    abi,
    bytecode,
    args: [LZ_ENDPOINTS[EIDS.FLOW_EVM_TESTNET] as `0x${string}`, EIDS.FLOW_EVM_TESTNET],
  });

  // Save metadata
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const meta = { tx: hash, deployedAt: new Date().toISOString(), rpc, account: account.address };
  fs.writeFileSync(outFile, JSON.stringify(meta, null, 2));
  console.log("Deployed. Metadata written to", outFile);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
