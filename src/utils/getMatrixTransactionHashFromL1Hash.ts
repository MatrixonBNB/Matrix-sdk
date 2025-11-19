import { createPublicClient, getAddress, Hex, http } from "viem";
import { bsc, bscTestnet } from "viem/chains";

import { MATRIX_INBOX_ADDRESS } from "../constants/addresses";
import { computeMatrixTransactionHash } from "./computeMatrixTransactionHash";
import { decodeMatrixEncodedTransaction } from "./decodeMatrixEncodedTransaction";

/**
 * Gets the Matrix transaction hash from an L1 transaction hash
 *
 * @param l1TransactionHash - The hash of the L1 transaction
 * @param l1ChainId - The chain ID of the L1 network (56 for BNB Chain mainnet, 97 for BNB Chain Testnet)
 * @returns The Matrix transaction hash
 * @throws Error if L1 chain is invalid or if the transaction is not a valid Matrix transaction
 */
export const getMatrixTransactionHashFromL1Hash = async (
  l1TransactionHash: Hex,
  l1ChainId: number
): Promise<Hex> => {
  if (l1ChainId !== 56 && l1ChainId !== 97) {
    throw new Error("Invalid L1 chain");
  }

  // Create a public client for the L1 chain
  const l1PublicClient = createPublicClient({
    chain: l1ChainId === 56 ? bsc : bscTestnet,
    transport: http(),
  });

  // Get the L1 transaction
  const l1Transaction = await l1PublicClient.getTransaction({
    hash: l1TransactionHash,
  });

  // Verify this is a transaction to the Matrix Inbox
  if (
    l1Transaction.to &&
    getAddress(l1Transaction.to) !== getAddress(MATRIX_INBOX_ADDRESS)
  ) {
    throw new Error("Transaction is not to Matrix Inbox address");
  }

  // Decode the transaction data to extract Matrix transaction parameters
  const { to, value, data, gasLimit, fctMintAmount } =
    await decodeMatrixEncodedTransaction(l1Transaction.input);

  // Compute and return the Matrix transaction hash
  return computeMatrixTransactionHash(
    l1TransactionHash,
    l1Transaction.from,
    to,
    value,
    data,
    gasLimit,
    fctMintAmount
  );
};
