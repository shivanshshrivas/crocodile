import { network } from "hardhat";

async function check(name: string) {
  const conn = await network.connect(name);
  const { viem } = conn;

  const [wallet] = await viem.getWalletClients();
  const pc = await viem.getPublicClient();

  const addr = wallet.account.address;
  const bal = await pc.getBalance({ address: addr });

  console.log(
    `${name.padEnd(12)} | ${addr} | balance: ${bal.toString()} (wei)`
  );
}

async function main() {
  await check("polygonAmoy");
  await check("sepolia");
  await check("flowEvm");
}
main().catch((e) => { console.error(e); process.exit(1); });
