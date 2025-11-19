import { defineChain } from "viem";
import { bsc, bscTestnet } from "viem/chains";
import { chainConfig } from "viem/op-stack";

// Matrix Testnet Configuration
export const matrixSepolia = defineChain({
  id: 0xbbbb2,
  name: "Matrix Testnet",
  nativeCurrency: { name: "Matrix Gas", symbol: "GAS", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://testnet.matrixlabs.app"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://testnet.explorer.matrixlabs.app",
    },
  },
  contracts: {
    ...chainConfig.contracts,
    l2OutputOracle: {
      [bscTestnet.id]: {
        address: "0x0ABE7852CfbF73963F6ae419a500CC04785d6a30",
      },
    },
    portal: {
      [bscTestnet.id]: {
        address: "0xF409695e35a73012760aBb8eD3c2a0b3F4e9354A",
      },
    },
    l1StandardBridge: {
      [bscTestnet.id]: {
        address: "0xEe49E40B2ef8C98011DB5B4999D93E8B766a7241",
      },
    },
    multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" },
  },
  sourceId: bscTestnet.id,
});

// Matrix Mainnet Configuration
export const matrixMainnet = defineChain({
  id: 0xbbbb1,
  name: "Matrix Mainnet",
  nativeCurrency: { name: "Matrix Gas", symbol: "GAS", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://mainnet.matrixlabs.app"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://explorer.matrixlabs.app",
    },
  },
  contracts: {
    ...chainConfig.contracts,
    l2OutputOracle: {
      [bsc.id]: {
        address: "0xD1e4cf142fDf7688A9f7734A5eE74d079696C5A6",
      },
    },
    portal: {
      [bsc.id]: {
        address: "0x8649Db4A287413567E8dc0EBe1dd62ee02B71eDD",
      },
    },
    l1StandardBridge: {
      [bsc.id]: {
        address: "0x8F75466D69a52EF53C7363F38834bEfC027A2909",
      },
    },
    multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" },
  },
  sourceId: bsc.id,
});
