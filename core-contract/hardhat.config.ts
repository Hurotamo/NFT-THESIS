import path from 'path';
import dotenv from 'dotenv';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { DEPLOYER_PRIVATE_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10,
      },
      viaIR: true,
    },
  },
  paths: {
    tests: "./test"
  },
  networks: DEPLOYER_PRIVATE_KEY ? {
    core_testnet: {
      accounts: [DEPLOYER_PRIVATE_KEY],
      url: 'https://rpc.test2.btcs.network',
      chainId: 1114
    },
  } : {},
};

export default config;
