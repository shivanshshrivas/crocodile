import { createWalletClient, createPublicClient, getContract, http, parseAbi } from "viem";
import fs from "fs";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";
import { EIDS } from "../utils/constants";

dotenv.config();

const abi = parseAbi([
  "function setPeer(uint32 eid, bytes32 peer) external",
  "function setHub(uint32 srcEid, bytes32 hub) external",
]);

// Preferred: provide these via env. Fallbacks below will try deployments/flowhub.json for FlowHub.
const ADDRS = {
  flowHub: process.env.FLOWHUB_ADDRESS || "",
  sepoliaSpoke: process.env.SEPOLIA_SPOKE_ADDRESS || "",
  amoySpoke: process.env.AMOY_SPOKE_ADDRESS || "",
};

const chains = {
  flow: {
    id: 545, name: "Flow EVM Testnet", network: "flow-evm-testnet",
    nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
    rpcUrls: { default: { http: [process.env.RPC_FLOW_EVM!] } }
  },
  sepolia: {
  id: 11155111, name: "Sepolia", network: "sepolia",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_SEPOLIA!] } }
  },
  amoy: {
  id: 80002, name: "Polygon Amoy", network: "amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_POLYGON_AMOY!] } }
  },
};

async function main() {
  // Normalize per-network private keys (fallback to generic PRIVATE_KEY)
  const rawFlowPk = process.env.PRIVATE_KEY_FLOW ?? process.env.PRIVATE_KEY;
  const rawSepoliaPk = process.env.PRIVATE_KEY_SEPOLIA ?? process.env.PRIVATE_KEY;
  const rawPolygonPk = process.env.PRIVATE_KEY_POLYGON ?? process.env.PRIVATE_KEY;

  if (!rawFlowPk) throw new Error("Missing PRIVATE_KEY_FLOW or PRIVATE_KEY for Flow network");
  if (!rawSepoliaPk) throw new Error("Missing PRIVATE_KEY_SEPOLIA or PRIVATE_KEY for Sepolia network");
  if (!rawPolygonPk) throw new Error("Missing PRIVATE_KEY_POLYGON or PRIVATE_KEY for Polygon Amoy network");

  const pkFlow = rawFlowPk.startsWith("0x") ? rawFlowPk : `0x${rawFlowPk}`;
  const pkSepolia = rawSepoliaPk.startsWith("0x") ? rawSepoliaPk : `0x${rawSepoliaPk}`;
  const pkPolygon = rawPolygonPk.startsWith("0x") ? rawPolygonPk : `0x${rawPolygonPk}`;

  const accountFlow = privateKeyToAccount(pkFlow as `0x${string}`);
  const accountSepolia = privateKeyToAccount(pkSepolia as `0x${string}`);
  const accountPolygon = privateKeyToAccount(pkPolygon as `0x${string}`);

  // Derive FlowHub address: prefer env, then try deployments/flowhub.json -> tx receipt
  let flowHubAddr = ADDRS.flowHub;
  if (!flowHubAddr) {
    const depPath = `${process.cwd()}/deployments/flowhub.json`;
    if (fs.existsSync(depPath)) {
      const meta = JSON.parse(fs.readFileSync(depPath, "utf8"));
      if (meta.tx && meta.rpc) {
  // create a public client to query receipt
  const probeClient = createPublicClient({ chain: chains.flow, transport: http() });
  const receipt = await probeClient.getTransactionReceipt({ hash: meta.tx as `0x${string}` });
        if (receipt && (receipt as any).contractAddress) {
          flowHubAddr = (receipt as any).contractAddress as string;
          console.log("Discovered FlowHub address from receipt:", flowHubAddr);
        }
      }
    }
  }

  if (!flowHubAddr) throw new Error("FlowHub address not found. Set FLOWHUB_ADDRESS env or ensure deployments/flowhub.json contains tx and the tx has a contractAddress.");

  // Spoke addresses: prefer env, then deployments metadata, then probe receipts
  let sepoliaSpokeAddr = ADDRS.sepoliaSpoke || process.env.SEPOLIA_SPOKE_ADDRESS || "";
  let amoySpokeAddr = ADDRS.amoySpoke || process.env.AMOY_SPOKE_ADDRESS || "";

  async function probeDeploymentForAddress(depPath: string, chain: any) {
    if (!fs.existsSync(depPath)) return undefined;
    try {
      const meta = JSON.parse(fs.readFileSync(depPath, "utf8"));
      if (meta.contractAddress) return meta.contractAddress as string;
      if (meta.tx) {
        const probeClient = createPublicClient({ chain, transport: http() });
        const receipt = await probeClient.getTransactionReceipt({ hash: meta.tx as `0x${string}` });
        if (receipt && (receipt as any).contractAddress) return (receipt as any).contractAddress as string;
      }
    } catch (e) {
      console.warn(`Failed to probe deployment metadata ${depPath}:`, (e as any)?.message ?? e);
    }
    return undefined;
  }

  if (!sepoliaSpokeAddr) {
    const dep = `${process.cwd()}/deployments/spoke-sepolia.json`;
    const discovered = await probeDeploymentForAddress(dep, chains.sepolia);
    if (discovered) {
      sepoliaSpokeAddr = discovered;
      console.log("Discovered Sepolia Spoke address from deployments/receipt:", sepoliaSpokeAddr);
    }
  }

  if (!amoySpokeAddr) {
    const dep = `${process.cwd()}/deployments/spoke-amoy.json`;
    const discovered = await probeDeploymentForAddress(dep, chains.amoy);
    if (discovered) {
      amoySpokeAddr = discovered;
      console.log("Discovered Amoy Spoke address from deployments/receipt:", amoySpokeAddr);
    }
  }

  if (!sepoliaSpokeAddr) throw new Error("Missing Sepolia spoke address. Set SEPOLIA_SPOKE_ADDRESS in env or ensure deployments/spoke-sepolia.json contains tx/contractAddress.");
  if (!amoySpokeAddr) throw new Error("Missing Amoy spoke address. Set AMOY_SPOKE_ADDRESS in env or ensure deployments/spoke-amoy.json contains tx/contractAddress.");

  // validate addresses
  function validateAddr(addr: string, name: string) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) throw new Error(`${name} must be a 0x-prefixed 20-byte hex address`);
  }
  validateAddr(flowHubAddr, "flowHub");
  validateAddr(sepoliaSpokeAddr, "sepoliaSpoke");
  validateAddr(amoySpokeAddr, "amoySpoke");

  const flow = createWalletClient({ account: accountFlow, chain: chains.flow, transport: http() });
  const flowHub = getContract({ address: flowHubAddr as `0x${string}`, abi, client: flow });

  // helper to call contract write with retries (handles 'replacement transaction underpriced')
  async function writeWithRetries(callFn: (overrides?: any) => Promise<any>, args: any[], chain: any) {
    // derive an initial gas suggestion from chain latest baseFeePerGas and per-chain recommended tip
    const probe = createPublicClient({ chain, transport: http() });
    let baseFee = BigInt(10_000_000_000); // default 10 gwei
    try {
      const block = await probe.getBlock({ blockTag: 'latest' });
      if ((block as any)?.baseFeePerGas) baseFee = (block as any).baseFeePerGas as bigint;
    } catch (e) {
      // ignore - fall back to defaults
    }

    const recommendedPriorityMap: Record<number, bigint> = {
      [chains.flow.id]: BigInt(1_000_000_000), // 1 gwei
      [chains.sepolia.id]: BigInt(2_000_000_000), // 2 gwei
      [chains.amoy.id]: BigInt(25_000_000_000), // 25 gwei (Polygon sometimes needs high tip)
    };

    let maxPriorityFeePerGas = recommendedPriorityMap[chain.id] ?? BigInt(2_000_000_000);
    let maxFeePerGas = baseFee * BigInt(2) + maxPriorityFeePerGas;

    const maxAttempts = 6;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await callFn({ args, maxFeePerGas, maxPriorityFeePerGas });
      } catch (e: any) {
        const msg = (e?.message ?? e?.toString() ?? "").toLowerCase();
        if ((msg.includes('replacement transaction underpriced') || msg.includes('transaction gas price below minimum')) && attempt < maxAttempts) {
          console.warn(`Attempt ${attempt} failed with gas error; increasing gas and retrying...`);
          // increase fees by 50% to be more aggressive when network requires higher tip
          maxFeePerGas = (maxFeePerGas * BigInt(150)) / BigInt(100);
          maxPriorityFeePerGas = (maxPriorityFeePerGas * BigInt(150)) / BigInt(100);
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        throw e;
      }
    }
    throw new Error('writeWithRetries: exhausted attempts');
  }

  // call setPeer on FlowHub for both spokes
  await writeWithRetries((overrides?: any) => flowHub.write.setPeer(overrides), [EIDS.SEPOLIA, bytes32(sepoliaSpokeAddr)], chains.flow);
  await writeWithRetries((overrides?: any) => flowHub.write.setPeer(overrides), [EIDS.POLYGON_AMOY, bytes32(amoySpokeAddr)], chains.flow);

  // set Spoke hubs (to FlowHub)
  const sepolia = createWalletClient({ account: accountSepolia, chain: chains.sepolia, transport: http() });
  const sepoliaSpoke = getContract({ address: sepoliaSpokeAddr as `0x${string}`, abi, client: sepolia });
  await writeWithRetries((overrides?: any) => sepoliaSpoke.write.setHub(overrides), [EIDS.FLOW_EVM_TESTNET, bytes32(flowHubAddr)], chains.sepolia);

  const amoy = createWalletClient({ account: accountPolygon, chain: chains.amoy, transport: http() });
  const amoySpoke = getContract({ address: amoySpokeAddr as `0x${string}`, abi, client: amoy });
  await writeWithRetries((overrides?: any) => amoySpoke.write.setHub(overrides), [EIDS.FLOW_EVM_TESTNET, bytes32(flowHubAddr)], chains.amoy);

  console.log("Peers wired.");
}

// helper to pack address into bytes32
function bytes32(addr: string) {
  return `0x${"0".repeat(24)}${addr.slice(2).toLowerCase()}` as `0x${string}`;
}

main().catch(console.error);
