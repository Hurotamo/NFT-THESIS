# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

## Node.js Version Compatibility

Please note that this project requires Node.js version 18.x or 20.x (LTS versions) for compatibility with Hardhat. Using Node.js versions outside this range, such as v23.x, may lead to unexpected behavior and warnings.

It is recommended to use a Node.js version manager like [nvm](https://github.com/nvm-sh/nvm) to switch to a supported Node.js version:

```bash
nvm install 20
nvm use 20
```

After switching to a supported Node.js version, please restart your terminal or IDE to ensure the changes take effect.
npx hardhat ignition deploy ./ignition/modules/Lock.ts
