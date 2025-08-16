import { createWalletClient, getContract, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";
import { EIDS } from "../utils/constants";

dotenv.config();

const abi = parseAbi([
  "function setPeer(uint32 eid, bytes32 peer) external",
  "function setHub(uint32 srcEid, bytes32 hub) external",
]);

// Fill these after deployments:
const ADDRS = {
  flowHub: "0xFlowHubAddress",
  sepoliaSpoke: "0xSepoliaSpokeAddress",
  amoySpoke: "0xAmoySpokeAddress",
};

const chains = {
  flow: {
    id: 990, name: "Flow EVM Testnet", network: "flow-evm-testnet",
    nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
    rpcUrls: { default: { http: [process.env.FLOW_EVM_RPC_URL!] } }
  },
  sepolia: {
    id: 11155111, name: "Sepolia", network: "sepolia",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [process.env.SEPOLIA_RPC_URL!] } }
  },
  amoy: {
    id: 80002, name: "Polygon Amoy", network: "amoy",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: { default: { http: [process.env.AMOY_RPC_URL!] } }
  },
};

async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  // set FlowHub peers (to Spokes)
  const flow = createWalletClient({ account, chain: chains.flow, transport: http() });
  const flowHub = getContract({ address: ADDRS.flowHub as `0x${string}`, abi, client: flow });

  await flowHub.write.setPeer([EIDS.SEPOLIA, bytes32(ADDRS.sepoliaSpoke)]);
  await flowHub.write.setPeer([EIDS.POLYGON_AMOY, bytes32(ADDRS.amoySpoke)]);

  // set Spoke hubs (to FlowHub)
  const sepolia = createWalletClient({ account, chain: chains.sepolia, transport: http() });
  const sepoliaSpoke = getContract({ address: ADDRS.sepoliaSpoke as `0x${string}`, abi, client: sepolia });
  await sepoliaSpoke.write.setHub([EIDS.FLOW_EVM_TESTNET, bytes32(ADDRS.flowHub)]);

  const amoy = createWalletClient({ account, chain: chains.amoy, transport: http() });
  const amoySpoke = getContract({ address: ADDRS.amoySpoke as `0x${string}`, abi, client: amoy });
  await amoySpoke.write.setHub([EIDS.FLOW_EVM_TESTNET, bytes32(ADDRS.flowHub)]);

  console.log("Peers wired.");
}

// helper to pack address into bytes32
function bytes32(addr: string) {
  return `0x${"0".repeat(24)}${addr.slice(2).toLowerCase()}` as `0x${string}`;
}

main().catch(console.error);
