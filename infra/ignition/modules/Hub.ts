import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("HubOffchainModule", (m) => {
  const MAILBOX = m.getParameter("MAILBOX"); // use your Flow mailbox (even if unused by watcher)
  const hub = m.contract("HubRegistry", [MAILBOX]);
  return { hub };
});
