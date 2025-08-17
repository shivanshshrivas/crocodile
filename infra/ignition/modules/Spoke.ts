import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SpokeModuleMailbox", (m) => {
  const MAILBOX = m.getParameter("MAILBOX");         // Sepolia/Amoy Mailbox
  const FLOW_DOMAIN = m.getParameter("FLOW_DOMAIN"); // 1000000747
  const HUB_RECIPIENT = m.getParameter("HUB_RECIPIENT"); // Hub on Flow

  const spoke = m.contract("SpokeRegistry", [MAILBOX, FLOW_DOMAIN, HUB_RECIPIENT]);
  return { spoke };
});
