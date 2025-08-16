// ignition/modules/EventLogger.module.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EventLoggerModule", (m) => {
  const eventLogger = m.contract("EventLogger", []);
  return { eventLogger };
});
