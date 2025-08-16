import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PartnerRelayLzModule", (m) => {
  const endpoint = m.getParameter("endpoint"); // LZ Endpoint on this partner chain
  const owner    = m.getAccount(0);

  const relay = m.contract("PartnerRelayLz", [endpoint, owner]);
  return { relay };
});
