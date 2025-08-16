import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";
import { EIDS, LZ_ENDPOINTS } from "../utils/constants";

dotenv.config();

const networks = {
  sepolia: {
    chain: {
      id: 11155111,
      name: "Sepolia",
      network: "sepolia",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [process.env.SEPOLIA_RPC_URL!] } },
    },
    eid: EIDS.SEPOLIA
  },
  amoy: {
    chain: {
      id: 80002,
      name: "Polygon Amoy",
      network: "amoy",
      nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
      rpcUrls: { default: { http: [process.env.AMOY_RPC_URL!] } },
    },
    eid: EIDS.POLYGON_AMOY
  },
} as const;

async function deploySpoke(target: keyof typeof networks) {
  const n = networks[target];
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const client = createWalletClient({ account, chain: n.chain, transport: http() });

  const artifact = (await import("../artifacts/contracts/SpokeOApp.sol/SpokeOApp.json")).default;
  const hash = await client.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [LZ_ENDPOINTS[n.eid] as `0x${string}`, n.eid],
  });

  console.log(`${target} Spoke deploy tx:`, hash);
}

(async () => {
  await deploySpoke("sepolia");
  await deploySpoke("amoy");
})();
