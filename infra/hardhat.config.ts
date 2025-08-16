import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-viem";
import * as dotenv from "dotenv";
dotenv.config();

const {
  // RPCs
  RPC_FLOW_EVM,
  RPC_SEPOLIA,
  RPC_POLYGON_AMOY,

  // Accounts
  PRIVATE_KEY_FLOW,
  PRIVATE_KEY_SEPOLIA,
  PRIVATE_KEY_POLYGON,

  // LayerZero (used at runtime by scripts/contracts; fine to keep here too)
  LZ_ENDPOINT_FLOW_EVM,
  LZ_ENDPOINT_SEPOLIA,
  LZ_ENDPOINT_POLYGON_AMOY,
  EID_FLOW_EVM,
  EID_SEPOLIA,
  EID_POLYGON_AMOY,
} = process.env;

const cfg: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    flowEvmTestnet: {
      url: RPC_FLOW_EVM!,
      type: "http",               // Hardhat 3 requires 'http' | 'edr-simulated'
      accounts: PRIVATE_KEY_FLOW ? [PRIVATE_KEY_FLOW] : [],
    },
    sepolia: {
      url: RPC_SEPOLIA!,
      type: "http",
      accounts: PRIVATE_KEY_SEPOLIA ? [PRIVATE_KEY_SEPOLIA] : [],
    },
    polygonAmoy: {
      url: RPC_POLYGON_AMOY!,
      type: "http",
      accounts: PRIVATE_KEY_POLYGON ? [PRIVATE_KEY_POLYGON] : [],
    },
  },
};
export default cfg;
