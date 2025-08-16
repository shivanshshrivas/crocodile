import { HardhatUserConfig } from "hardhat/config";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  plugins: [hardhatViem],         
  solidity: { version: "0.8.28" },
  networks: {
    polygonAmoy: { type: "http", url: process.env.RPC_POLYGON_AMOY!, accounts: [process.env.PRIVATE_KEY_POLYGON!], chainId: 80002 },
    sepolia:     { type: "http", url: process.env.RPC_SEPOLIA!, accounts: [process.env.PRIVATE_KEY_SEPOLIA!], chainId: 11155111 },
    flowEvm:     { type: "http", url: process.env.RPC_FLOW_EVM!, accounts: [process.env.PRIVATE_KEY_FLOW!], chainId: 545 },
  },
};
export default config;
