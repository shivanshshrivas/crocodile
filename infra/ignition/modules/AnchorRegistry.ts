import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AnchorRegistryModule", (m) => {
  const endpoint = m.getParameter("endpoint");