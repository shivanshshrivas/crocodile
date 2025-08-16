// ignition/modules/AnchorRelay.module.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// You must pass your chain's EndpointV2 address at deploy time via params.
// Example (Base Sepolia, Arbitrum Sepolia have different EIDs & endpoints — see LayerZero deployments).
// Docs: deployed contracts + endpoint IDs. 
export default buildModule("AnchorRelayModule", (m) => {
  const endpoint = m.getParameter("endpoint", "0x0000000000000000000000000000000000000000");
  const delegate = m.getAccount(0);

  const { anchorRegistry } = m.useModule("AnchorRegistryModule");

  const anchorRelay = m.contract("AnchorRelay", [endpoint, delegate, anchorRegistry]);

  // Optional: after deploy, configure peers with a separate script/tx:
  // await anchorRelay.setPeer(dstEid, addressToBytes32(remoteAnchorRelay));

  return { anchorRelay };
});
