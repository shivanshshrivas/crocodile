import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ignition";
import * as dotenv from "dotenv";
dotenv.config();

// Per-network private keys from .env
const FLOW_MAINNET_PRIVATE_KEY = process.env
  .FLOW_MAINNET_PRIVATE_KEY as `0x${string}` | undefined;
const SEPOLIA_TESTNET_PRIVATE_KEY = process.env
  .SEPOLIA_TESTNET_PRIVATE_KEY as `0x${string}` | undefined;
const AMOY_TESTNET_PRIVATE_KEY = process.env
  .AMOY_TESTNET_PRIVATE_KEY as `0x${string}` | undefined;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    // Hardhat v3 requires explicit type for RPC networks
    flowMainnet: {
      type: "http",
      url: process.env.FLOW_MAINNET_RPC || "",
      accounts: FLOW_MAINNET_PRIVATE_KEY ? [FLOW_MAINNET_PRIVATE_KEY] : []
    },
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_TESTNET_RPC || "",
      accounts: SEPOLIA_TESTNET_PRIVATE_KEY
        ? [SEPOLIA_TESTNET_PRIVATE_KEY]
        : []
    },
    polygonAmoy: {
      type: "http",
      url: process.env.AMOY_TESTNET_RPC || "",
      accounts: AMOY_TESTNET_PRIVATE_KEY ? [AMOY_TESTNET_PRIVATE_KEY] : []
    }
  }
};

export default config;
