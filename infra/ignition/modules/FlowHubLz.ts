import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FlowHubLzModule", (m) => {
  // You must pass the LayerZero Endpoint address for Flow EVM Testnet
  const endpoint = m.getParameter("flowEndpoint");
  const owner    = m.getAccount(0);

  const hub = m.contract("FlowHubLz", [endpoint, owner]);
  return { hub };
});
