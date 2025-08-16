import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";
import { EIDS, LZ_ENDPOINTS } from "../utils/constants";
import fs from "fs";

dotenv.config();

const networks = {
  sepolia: {
    chain: {
      id: 11155111,
      name: "Sepolia",
      network: "sepolia",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [process.env.RPC_SEPOLIA!] } },
    },
    eid: EIDS.SEPOLIA,
    pk: process.env.PRIVATE_KEY_SEPOLIA ?? process.env.PRIVATE_KEY
  },
  amoy: {
    chain: {
      id: 80002,
      name: "Polygon Amoy",
      network: "amoy",
      nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
      rpcUrls: { default: { http: [process.env.RPC_POLYGON_AMOY!] } },
    },
    eid: EIDS.POLYGON_AMOY,
    pk: process.env.PRIVATE_KEY_POLYGON ?? process.env.PRIVATE_KEY
  },
} as const;

async function deploySpoke(target: keyof typeof networks) {
  const n = networks[target];
  const rawPk = n.pk;
  if (!rawPk) throw new Error(`Missing private key for network ${target}`);
  const pk = rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`;
  const account = privateKeyToAccount(pk as `0x${string}`);
  const client = createWalletClient({ account, chain: n.chain, transport: http() });

  const artifact = (await import("../artifacts/contracts/SpokeOApp.sol/SpokeOApp.json")).default;
  const bytecode = artifact.bytecode as `0x${string}`;
  const abi = artifact.abi as any;
  const txHash = await client.deployContract({
    abi,
    bytecode,
    args: [LZ_ENDPOINTS[n.eid] as `0x${string}`, n.eid],
  });

  console.log(`${target} Spoke deploy tx:`, txHash);

  // attempt to discover contract address from receipt and save metadata
  const publicClient = createPublicClient({ chain: n.chain, transport: http() });
  // wait for receipt with retries
  let receipt: any = null;
  for (let i = 0; i < 12; i++) {
    try {
      receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
      if (receipt) break;
    } catch (e) {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  const contractAddress = (receipt as any)?.contractAddress ?? null;
  const outDir = `${process.cwd()}/deployments`;
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = `${outDir}/spoke-${target}.json`;
  const meta = { tx: txHash, contractAddress: contractAddress ?? null, deployedAt: new Date().toISOString() };
  fs.writeFileSync(outFile, JSON.stringify(meta, null, 2));
  console.log(`Wrote metadata to ${outFile}`);
}

(async () => {
  await deploySpoke("sepolia");
  await deploySpoke("amoy");
})();
