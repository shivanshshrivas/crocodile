// scripts/testMirror.ts
import "dotenv/config";
import fs from "fs";
import {
  createWalletClient,
  createPublicClient,
  decodeEventLog,
  getAddress,
  http,
  parseAbi,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ---- Chains ----
const FLOW = {
  id: 545,
  name: "Flow EVM Testnet",
  network: "flow-evm-testnet",
  nativeCurrency: { name: "FLOW", symbol: "FLOW", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_FLOW_EVM!] } },
} as const;

const SEP = {
  id: 11155111,
  name: "Sepolia",
  network: "sepolia",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_SEPOLIA!] } },
} as const;

const AMOY = {
  id: 80002,
  name: "Polygon Amoy",
  network: "amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_POLYGON_AMOY!] } },
} as const;

// ---- EIDs ----
const EID_FLOW = Number(process.env.EID_FLOW_EVM || 40351);
const EID_SEP = Number(process.env.EID_SEPOLIA || 40161);
const EID_AMOY = Number(process.env.EID_POLYGON_AMOY || 40267);

// ---- ABIs ----
const FLOW_HUB_ABI = parseAbi([
  "event MirrorAcked(uint256 indexed companyId, bytes32 payloadHash, uint32 dstEid, bool ok, bytes32 dstTxHash, uint64 nonce)",
  "event BlockMirrorInitiated(uint256 indexed companyId, bytes32 payloadHash, uint256 userId, uint256 workspaceId, uint32 dstEid, uint64 nonce)",
  "function registerCompany(uint256 companyId, address companyOwner, bool hasOwnChain, uint32 dstEid, string metaURI) external",
  "function pushBlock(uint256 companyId, bytes32 payloadHash, uint256 userId, uint256 workspaceId, uint64 nonce, bytes lzOptions) payable",
  "function companies(uint256) view returns (address owner, bool hasOwnChain, uint32 dstEid, string metaURI, bool exists)"
]);

const SPOKE_ABI = parseAbi([
  "event BlockMirrored(uint256 indexed companyId, bytes32 payloadHash, uint32 srcEid, bytes32 dstTxHashLike, uint64 nonce)",
  "function ackFeeWei() view returns (uint256)"
]);

// ---- Util ----
function readJson(path: string) {
  return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : null;
}
const toBytes32 = (addr: `0x${string}`) => `0x${"0".repeat(24)}${addr.slice(2)}` as `0x${string}`;
const nonzero = (h: `0x${string}`) => h && h !== "0x0000000000000000000000000000000000000000000000000000000000000000";

// ---- Main ----
async function main() {
  // choose destination: "amoy" or "sepolia"
  const argvTarget = process.argv.slice(2).find(a => a === "amoy" || a === "sepolia") as ("amoy"|"sepolia"|undefined);
  const envTarget = (process.env.TARGET || process.env.DST || process.env.CHAIN) as ("amoy"|"sepolia"|undefined);
  const target = (envTarget || argvTarget || "amoy") as "amoy" | "sepolia";
  const dstChain = target === "amoy" ? AMOY : SEP;
  const dstEid = target === "amoy" ? EID_AMOY : EID_SEP;

  // addresses: read from deployments/* or env
  let flowHub =
    (readJson("deployments/flowhub.json")?.contractAddress as `0x${string}` | undefined) ||
    (process.env.FLOW_HUB_ADDRESS as `0x${string}` | undefined);

  const spokeFile = `deployments/spoke-${target}.json`;
  const spoke = readJson(spokeFile)?.contractAddress as `0x${string}` | undefined;
  if (!spoke) throw new Error(`Missing Spoke address (${spokeFile})`);

  // clients
  const flowAccount = privateKeyToAccount(process.env.PRIVATE_KEY_FLOW as `0x${string}`);
  const flowWallet = createWalletClient({ account: flowAccount, chain: FLOW, transport: http() });
  const flowPub = createPublicClient({ chain: FLOW, transport: http() });

  const dstPub = createPublicClient({ chain: dstChain, transport: http() });

  // If FlowHub address missing, try discover via deployments tx receipt
  if (!flowHub) {
    const dep = readJson("deployments/flowhub.json");
    if (dep?.tx) {
      try {
        const rcpt = await flowPub.getTransactionReceipt({ hash: dep.tx as `0x${string}` });
        const addr = (rcpt as any).contractAddress as `0x${string}` | undefined;
        if (addr) {
          flowHub = addr;
          console.log("Discovered FlowHub from receipt:", flowHub);
        }
      } catch {}
    }
  }
  if (!flowHub) throw new Error("Missing FlowHub address (deployments/flowhub.json or FLOW_HUB_ADDRESS)");

  // sanity: Spoke ack fee funded?
  try {
  const ackFee = await dstPub.readContract({ address: spoke, abi: SPOKE_ABI, functionName: "ackFeeWei" }) as unknown as bigint;
  console.log(`[sanity] ${target} Spoke @ ${spoke} ackFeeWei = ${ackFee} wei`);
  if ((ackFee) === 0n) {
      console.warn(`⚠️  ackFeeWei is 0. Set it & fund the Spoke with native before testing.`);
    }
  } catch {
    console.log(`[sanity] ${target} Spoke @ ${spoke}: ackFeeWei() not found, skipping fee hint.`);
  }

  // sanity: company
  const companyId = BigInt(process.env.COMPANY_ID || 2);
  const company = await flowPub.readContract({ address: flowHub, abi: FLOW_HUB_ABI, functionName: "companies", args: [companyId] });
  let exists = company[4] as boolean;
  let hasOwn = company[1] as boolean;
  let currentDst = company[2] as number;

  if (!exists) {
    console.log(`[action] registerCompany(companyId=${companyId}, hasOwnChain=true, dstEid=${dstEid})`);
    const regTx = await flowWallet.writeContract({
      address: flowHub,
      abi: FLOW_HUB_ABI,
      functionName: "registerCompany",
      args: [companyId, flowAccount.address, true, dstEid, `company-${target}`],
    });
    console.log("registerCompany tx:", regTx);
    await flowPub.waitForTransactionReceipt({ hash: regTx as `0x${string}` });
    exists = true; hasOwn = true; currentDst = dstEid;
  } else {
    console.log(`[info] company exists: owner=${getAddress(company[0] as string)}, hasOwn=${hasOwn}, dstEid=${currentDst}`);
    if (!hasOwn || currentDst !== dstEid) {
      console.warn(`⚠️  Company ${companyId} hasOwn=${hasOwn} dstEid=${currentDst} (expected ${dstEid}). Use a different COMPANY_ID or re-register.`);
    }
  }

  // push block (Flow -> Spoke)
  const payloadHash = toHex(`demo-${Date.now()}`, { size: 32 });
  const userId = 123n;
  const workspaceId = 456n;
  const nonce = BigInt.asUintN(64, BigInt(Date.now()));
  const lzOptions = "0x"; // defaults

  const forwardFeeWei = BigInt(process.env.FORWARD_FEE_WEI || 1e16); // 0.01 FLOW default
  console.log(`[action] pushBlock(company=${companyId}, dst=${target}, fee=${forwardFeeWei} wei)`);
  const pushTx = await flowWallet.writeContract({
    address: flowHub,
    abi: FLOW_HUB_ABI,
    functionName: "pushBlock",
    args: [companyId, payloadHash as `0x${string}`, userId, workspaceId, nonce, lzOptions as `0x${string}`],
    value: forwardFeeWei,
  });
  console.log("pushBlock tx:", pushTx);

  // wait & decode Flow receipt
  const flowRcpt = await flowPub.waitForTransactionReceipt({ hash: pushTx as `0x${string}` });
  const flowLogs = flowRcpt.logs
    .map(l => {
      try { return decodeEventLog({ abi: FLOW_HUB_ABI, data: l.data, topics: l.topics }); }
      catch { return null; }
    })
    .filter(Boolean) as any[];

  const ack = flowLogs.find(l => l.eventName === "MirrorAcked");
  if (!ack) {
    console.warn("⚠️  No MirrorAcked found on Flow. Likely ACK failed (fund Spoke & set ackFeeWei, or raise forward fee).");
  } else {
    console.log("MirrorAcked:", ack.args);
    const ok = ack.args.ok as boolean;
    const gotDst = Number(ack.args.dstEid);
    const dstTxLike = ack.args.dstTxHash as `0x${string}`;
    console.log(`[result] ok=${ok} dstEid=${gotDst} dstTxLike=${dstTxLike}`);
    if (!ok || gotDst !== dstEid || !nonzero(dstTxLike)) {
      console.warn("⚠️  Unexpected ack fields (dst or tx). Check Spoke funding / ackFee / peers/hubs wiring.");
    }
  }

  // scan destination for BlockMirrored logs around 'latest'
  const latest = await dstPub.getBlockNumber();
  const from = latest - 300n > 0n ? latest - 300n : 0n;
  const logs = await dstPub.getLogs({ address: spoke, fromBlock: from, toBlock: latest });
  let found = false;
  for (const log of logs) {
    try {
      const ev = decodeEventLog({ abi: SPOKE_ABI, data: log.data, topics: log.topics });
      if (ev.eventName === "BlockMirrored") {
        const args = ev.args as any;
        if ((args.companyId as bigint) === companyId && (args.payloadHash as string).toLowerCase() === (payloadHash as string).toLowerCase()) {
          console.log("BlockMirrored:", args);
          found = true;
          break;
        }
      }
    } catch {}
  }
  if (!found) {
    console.warn(`⚠️  No BlockMirrored found yet on ${target}. Try widening the scan or check fees/wiring.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
