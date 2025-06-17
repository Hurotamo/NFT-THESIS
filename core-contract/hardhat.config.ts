import path from 'path';
import dotenv from 'dotenv';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { PRIVATE_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  paths: {
    tests: "./test"
  },
  networks: {
    core_testnet: {
      accounts: [
        PRIVATE_KEY as string
      ],
      url: 'https://rpc.test2.btcs.network',
      chainId: 1114
    },
  }
};

export default config;
