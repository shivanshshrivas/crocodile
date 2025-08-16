import { createWalletClient, http, parseAbi, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";
import { EIDS } from "../utils/constants";

dotenv.config();

const FLOW = {
  id: 990, name: "Flow EVM Testnet", network: "flow-evm-testnet",
  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
  rpcUrls: { default: { http: [process.env.FLOW_EVM_RPC_URL!] } },
};

const abi = parseAbi([
  "function pushBlock(uint256 companyId, bytes32 payloadHash, uint256 userId, uint256 workspaceId, uint64 nonce, bytes lzOptions) payable",
]);

async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const client = createWalletClient({ account, chain: FLOW, transport: http() });
  const flowHub = "0xFlowHubAddress";

  const companyId = 1n;
  const payloadHash = toHex("example-payload", { size: 32 }); // replace with real hash
  const userId = 123n;
  const workspaceId = 456n;
  const nonce = 1n;

  // Minimal options for LZ executor (empty = use defaults)
  const lzOptions = "0x";

  const hash = await client.writeContract({
    address: flowHub as `0x${string}`,
    abi,
    functionName: "pushBlock",
    args: [companyId, payloadHash as `0x${string}`, userId, workspaceId, Number(nonce), lzOptions as `0x${string}`],
    // fund native for LZ fees on Flow EVM if mirroring
    value: 0n,
  });

  console.log("pushBlock tx:", hash);
}

main().catch(console.error);
