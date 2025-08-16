# infra

This folder contains Hardhat + viem deployment scripts for the project.

## Required environment variables
Create a `.env` file inside `infra/` with at least the following keys:

- `PRIVATE_KEY_FLOW` or `PRIVATE_KEY` - hex private key of deployer (0x...)
- `FLOW_EVM_RPC_URL` - RPC URL for Flow EVM Testnet
- `RPC_FLOW_EVM` - (used by hardhat network config)
- `PRIVATE_KEY_FLOW` - (used by hardhat network config)

Optional network envs used in `hardhat.config.ts`:
- `RPC_SEPOLIA`, `PRIVATE_KEY_SEPOLIA`
- `RPC_POLYGON_AMOY`, `PRIVATE_KEY_POLYGON`

## Common commands
From `infra/` folder run:

```powershell
# compile
npx hardhat compile

# run deploy script (uses env vars)
npx hardhat run scripts/deployFlowHub.ts --network flowEvmTestnet
```

## Notes
- The deploy script is idempotent and will write `deployments/flowhub.json` with metadata after a successful deploy.
- The repo uses `viem` for wallet + deployment; ensure the `.env` keys are present before running scripts.
