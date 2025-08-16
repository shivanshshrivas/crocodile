import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CrocOApp", (m) => {
  const endpoint = m.getParameter("endpoint") as string;
  const oapp = m.contract("CrocOApp", [endpoint]);
  return { oapp };
});
