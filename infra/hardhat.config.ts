import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-viem";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    flowEvmTestnet: {
      url: process.env.RPC_FLOW_EVM!,
      type: "http",
      accounts: [process.env.PRIVATE_KEY_FLOW!],
    },
    sepolia: {
      url: process.env.RPC_SEPOLIA!,
      type: "http",
      accounts: [process.env.PRIVATE_KEY_SEPOLIA!],
    },
    polygonAmoy: {
      url: process.env.RPC_POLYGON_AMOY!,
      type: "http",
      accounts: [process.env.PRIVATE_KEY_POLYGON!],
    },
  },
};

export default config;
