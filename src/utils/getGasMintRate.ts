import { createPublicClient, http } from "viem";

import { L2_L1_BLOCK_CONTRACT } from "../constants/addresses";
import { matrixMainnet, matrixSepolia } from "../viem";

/**
 * Retrieves the current FCT mint rate from the L1 block contract.
 *
 * @param l1ChainId - The chain ID of the L1 network (56 for BNB Chain mainnet, 97 for BNB Chain testnet)
 * @returns A Promise that resolves to the current FCT mint rate as a bigint
 */
export const getFctMintRate = async (l1ChainId: 56 | 97) => {
  if (l1ChainId !== 56 && l1ChainId !== 97) {
    throw new Error("Invalid chain id");
  }

  const matrixPublicClient = createPublicClient({
    chain: l1ChainId === 56 ? matrixMainnet : matrixSepolia,
    transport: http(),
  });

  const fctMintRate = await matrixPublicClient.readContract({
    address: L2_L1_BLOCK_CONTRACT,
    abi: [
      {
        inputs: [],
        name: "fctMintRate",
        outputs: [
          {
            internalType: "uint128",
            name: "",
            type: "uint128",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "fctMintRate",
  });

  return fctMintRate;
};
