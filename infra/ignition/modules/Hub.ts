import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const HubModule = buildModule("HubModule", (m) => {
  const hub = m.contract("HubRegistry");
  return { hub };
});

export default HubModule;
