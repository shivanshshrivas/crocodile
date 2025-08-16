import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-viem";
import * as dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var ${key}. Set it in .env`);
  return v;
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    flowEvmTestnet: {
      url: requireEnv("RPC_FLOW_EVM"),
      type: "http",
      accounts: [requireEnv("PRIVATE_KEY_FLOW")],
    },
    sepolia: {
      url: requireEnv("RPC_SEPOLIA"),
      type: "http",
      accounts: [requireEnv("PRIVATE_KEY_SEPOLIA")],
    },
    polygonAmoy: {
      url: requireEnv("RPC_POLYGON_AMOY"),
      type: "http",
      accounts: [requireEnv("PRIVATE_KEY_POLYGON")],
    },
  },
};

export default config;
