// ignition/modules/CertificateNFT.module.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CertificateNFTModule", (m) => {
  const admin = m.getAccount(0);
  const { flowHub } = m.useModule("FlowHubModule");

  const certificate = m.contract("CertificateNFT", [admin]);

  // Grant FlowHub issuing rights
  m.call(certificate, "grantRole", [m.staticCall(certificate, "ISSUER_ROLE"), flowHub]);

  return { certificate };
});
