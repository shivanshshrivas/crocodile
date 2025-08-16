// ignition/modules/AnchorRegistry.module.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AnchorRegistryModule", (m) => {
  const { companyRegistry } = m.useModule("CompanyRegistryModule");

  const admin = m.getAccount(0);
  const anchorRegistry = m.contract("AnchorRegistry", [companyRegistry, admin]);

  return { anchorRegistry };
});
