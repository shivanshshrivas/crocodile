import { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatIgnition from "@nomicfoundation/hardhat-ignition";
import hardhatIgnitionViem from "@nomicfoundation/hardhat-ignition-viem";
import * as dotenv from "dotenv";
dotenv.config();

const {
  FLOW_MAINNET_RPC,
  SEPOLIA_TESTNET_RPC,
  AMOY_TESTNET_RPC,
  FLOW_MAINNET_PRIVATE_KEY,
  SEPOLIA_TESTNET_PRIVATE_KEY,
  AMOY_TESTNET_PRIVATE_KEY,
} = process.env;

const acct = (k?: string) => (k ? [k as `0x${string}`] : []);

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViem, hardhatIgnition, hardhatIgnitionViem],
  solidity: {
    version: "0.8.28",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    flowMainnet: {
      type: "http",
      url: FLOW_MAINNET_RPC ?? "",
      accounts: acct(FLOW_MAINNET_PRIVATE_KEY),
    },
    sepolia: {
      type: "http",
      url: SEPOLIA_TESTNET_RPC ?? "",
      accounts: acct(SEPOLIA_TESTNET_PRIVATE_KEY),
    },
    polygonAmoy: {
      type: "http",
      url: AMOY_TESTNET_RPC ?? "",
      accounts: acct(AMOY_TESTNET_PRIVATE_KEY),
    },
  },
};

export default config;
