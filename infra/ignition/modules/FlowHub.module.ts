// ignition/modules/FlowHub.module.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FlowHubModule", (m) => {
  const { companyRegistry } = m.useModule("CompanyRegistryModule");
  const { anchorRegistry }  = m.useModule("AnchorRegistryModule");
  const { eventLogger }     = m.useModule("EventLoggerModule");
  const { anchorRelay }     = m.useModule("AnchorRelayModule");

  const admin = m.getAccount(0);

  const flowHub = m.contract("FlowHub", [
    companyRegistry,
    anchorRegistry,
    eventLogger,
    anchorRelay,
    admin
  ]);

  // Grant FlowHub permission to write anchors
  m.call(anchorRegistry, "grantRole", [m.staticCall(anchorRegistry, "ANCHOR_WRITER_ROLE"), flowHub]);

  return { flowHub };
});
