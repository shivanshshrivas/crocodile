import { createWalletClient, createPublicClient, http, parseAbi, toHex } from "viem";
import fs from "fs";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

const FLOW = {
  id: 545, name: "Flow EVM Testnet", network: "flow-evm-testnet",
  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_FLOW_EVM!] } },
};

const abi = parseAbi([
  "function pushBlock(uint256 companyId, bytes32 payloadHash, uint256 userId, uint256 workspaceId, uint64 nonce, bytes lzOptions) payable",
  "function registerCompany(uint256 companyId, address companyOwner, bool hasOwnChain, uint32 dstEid, string metaURI)",
  "function companies(uint256) view returns (address owner, bool hasOwnChain, uint32 dstEid, string metaURI, bool exists)",
  "function owner() view returns (address)",
]);

async function main() {
  const rawPk = process.env.PRIVATE_KEY_FLOW ?? process.env.PRIVATE_KEY;
  if (!rawPk) throw new Error("Missing PRIVATE_KEY_FLOW or PRIVATE_KEY in env");
  const pk = rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`;
  const account = privateKeyToAccount(pk as `0x${string}`);
  const client = createWalletClient({ account, chain: FLOW, transport: http() });

  // Resolve FlowHub address: prefer env, then deployments/flowhub.json -> receipt
  let flowHub = process.env.FLOWHUB_ADDRESS || "";
  if (!flowHub) {
    const dep = `${process.cwd()}/deployments/flowhub.json`;
    if (fs.existsSync(dep)) {
      try {
        const meta = JSON.parse(fs.readFileSync(dep, 'utf8'));
        if (meta.contractAddress) flowHub = meta.contractAddress;
        else if (meta.tx) {
          const probe = createPublicClient({ chain: FLOW, transport: http() });
          const receipt = await probe.getTransactionReceipt({ hash: meta.tx as `0x${string}` });
          if (receipt && (receipt as any).contractAddress) flowHub = (receipt as any).contractAddress as string;
        }
      } catch (e: any) {
        console.warn('Failed reading deployments/flowhub.json:', e?.message ?? e);
      }
    }
  }

  if (!flowHub) throw new Error('FlowHub address not found. Set FLOWHUB_ADDRESS in env or ensure deployments/flowhub.json contains tx/contractAddress.');
  if (!/^0x[0-9a-fA-F]{40}$/.test(flowHub)) throw new Error(`FlowHub address invalid: ${flowHub}`);

  const companyId = 1n;
  const payloadHash = toHex("example-payload", { size: 32 }); // replace with real hash
  const userId = 123n;
  const workspaceId = 456n;
  const nonce = 1n; // uint64 as bigint

  // Minimal options for LZ executor (empty = use defaults)
  const lzOptions = "0x";

  const publicClient = createPublicClient({ chain: FLOW, transport: http() });

  // Check company exists
  const comp = await publicClient.readContract({ address: flowHub as `0x${string}`, abi, functionName: "companies", args: [companyId] });
  // comp may be an array-like tuple or an object with fields; extract defensively
  const compAny = comp as any;
  const compOwner = compAny.owner ?? compAny[0];
  const compHasOwnChain = compAny.hasOwnChain ?? compAny[1];
  const compDstEid = compAny.dstEid ?? compAny[2];
  const compMeta = compAny.metaURI ?? compAny[3];
  const compExists = !!(compAny.exists ?? compAny[4]);

  console.log("FlowHub company lookup:", {
    companyId: String(companyId),
    owner: compOwner,
    hasOwnChain: compHasOwnChain,
    dstEid: compDstEid,
    metaURI: compMeta,
    exists: compExists,
  });

  if (!compExists) {
    // check if we are contract owner so we can register
    const contractOwner = await publicClient.readContract({ address: flowHub as `0x${string}`, abi, functionName: "owner" });
    if (String(contractOwner).toLowerCase() !== account.address.toLowerCase()) {
      throw new Error(`Company ${companyId} not registered and script account is not FlowHub owner; register the company first or run with the deployer key.`);
    }
    console.log(`Registering company ${companyId} (hasOwnChain=false) as owner ${account.address}...`);
    try {
      await client.writeContract({ address: flowHub as `0x${string}`, abi, functionName: "registerCompany", args: [companyId, account.address, false, 0, "test-company"] });
      console.log("Company registered.");
    } catch (e: any) {
      const msg = (e?.message ?? e?.toString() ?? "").toLowerCase();
      if (msg.includes('exists')) {
        console.log('RegisterCompany reverted with exists; assuming company already registered and continuing.');
      } else {
        throw e;
      }
    }

    // re-check company exists after attempted registration
    const comp2 = await publicClient.readContract({ address: flowHub as `0x${string}`, abi, functionName: "companies", args: [companyId] });
    const comp2Any = comp2 as any;
    const comp2Exists = !!(comp2Any.exists ?? comp2Any[4]);
    if (!comp2Exists) throw new Error(`Company ${companyId} still not registered after attempt`);
  }

  const hash = await client.writeContract({
    address: flowHub as `0x${string}`,
    abi,
    functionName: "pushBlock",
    args: [companyId, payloadHash as `0x${string}`, userId, workspaceId, nonce, lzOptions as `0x${string}`],
    // fund native for LZ fees on Flow EVM if mirroring
    value: 0n,
  });

  console.log("pushBlock tx:", hash);
}

// Minimal EIDs mapping used by this script (avoid an ESM import resolution issue)
const EIDS = {
  FLOW_EVM_TESTNET: 40351,
  SEPOLIA: 11155111,
  POLYGON_AMOY: 80002,
};

main().catch(console.error);
