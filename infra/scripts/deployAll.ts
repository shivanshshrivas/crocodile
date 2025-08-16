import { spawnSync } from "child_process";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function requireEnv(key: string) {
  if (!process.env[key]) {
    console.error(`Missing env ${key}`);
    process.exit(1);
  }
}

// Validate minimal envs
requireEnv("PRIVATE_KEY_FLOW");
requireEnv("RPC_FLOW_EVM");

const steps = [
  { cmd: ["hardhat", "run", "scripts/deployFlowHub.ts", "--network", "flowEvmTestnet"], desc: "Deploy FlowHub" },
  { cmd: ["hardhat", "run", "scripts/deploySpoke.ts", "--network", "sepolia"], desc: "Deploy Sepolia Spoke" },
  { cmd: ["hardhat", "run", "scripts/deploySpoke.ts", "--network", "polygonAmoy"], desc: "Deploy Amoy Spoke" },
  { cmd: ["hardhat", "run", "scripts/setPeers.ts"], desc: "Wire peers (setPeers)" },
  { cmd: ["hardhat", "run", "scripts/pushBlock.ts", "--network", "flowEvmTestnet"], desc: "Push test block (pushBlock)" },
];

for (const s of steps) {
  console.log(`\n=== ${s.desc} ===`);
  const res = spawnSync("npx", s.cmd, { stdio: "inherit", shell: true, cwd: process.cwd() });
  if (res.error || res.status !== 0) {
    console.error(`${s.desc} failed. Aborting.`);
    process.exit(1);
  }
}

console.log("All steps completed.");
