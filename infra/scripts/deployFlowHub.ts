import { createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";
import { EIDS, LZ_ENDPOINTS } from "../utils/constants";

dotenv.config();

const FLOW_EVM = {
  id: 990, // arbitrary local id for viem client; not the LZ EID
  name: "Flow EVM Testnet",
  network: "flow-evm-testnet",
  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
  rpcUrls: { default: { http: [process.env.FLOW_EVM_RPC_URL!] } },
};

const FlowHubAbi = parseAbi([
  "function owner() view returns (address)",
  "constructor(address _endpoint, uint32 _flowEid)",
  "function setPeer(uint32 eid, bytes32 peer) external",
  "function registerCompany(uint256, address, bool, uint32, string) external",
]);

async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const client = createWalletClient({ account, chain: FLOW_EVM, transport: http() });

  const bytecode = (await import("../artifacts/contracts/FlowHub.sol/FlowHub.json")).default.bytecode;
  const abi = (await import("../artifacts/contracts/FlowHub.sol/FlowHub.json")).default.abi;

  const hash = await client.deployContract({
    abi,
    bytecode,
    args: [LZ_ENDPOINTS[EIDS.FLOW_EVM_TESTNET] as `0x${string}`, EIDS.FLOW_EVM_TESTNET],
  });

  console.log("Deploy tx:", hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
