import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SpokeModule = buildModule("SpokeModule", (m) => {
  const spoke = m.contract("SpokeRegistry");
  return { spoke };
});

export default SpokeModule;
