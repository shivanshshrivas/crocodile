// ignition/modules/CompanyRegistry.module.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CompanyRegistryModule", (m) => {
  const admin = m.getAccount(0);

  const companyRegistry = m.contract("CompanyRegistry", [admin]);

  return { companyRegistry };
});
