import {
  Address,
  concatHex,
  createPublicClient,
  Hex,
  http,
  maxUint256,
  toBytes,
  toHex,
  toRlp,
} from "viem";
import { bsc, bscTestnet } from "viem/chains";

import { MATRIX_INBOX_ADDRESS } from "../constants/addresses";
import { MatrixTransactionParams } from "../types";
import { matrixMainnet, matrixSepolia } from "../viem";
import { calculateInputGasCost } from "./calculateInputGasCost";
import { computeMatrixTransactionHash } from "./computeMatrixTransactionHash";
import { getFctMintRate } from "./getGasMintRate";

interface L1Transaction {
  account: Address;
  to: Address;
  value: bigint;
  data: Hex;
  gas: bigint;
  chainId: number;
}

/**
 * Sends a raw Matrix transaction by preparing the transaction data and submitting it to L1.
 *
 * @param l1ChainId - The chain ID of the L1 network (56 for mainnet, 97 for Testnet)
 * @param account - The address of the account initiating the transaction
 * @param params - Transaction parameters including to, value, and data
 * @param sendL1Transaction - Function to send the L1 transaction and return the transaction hash
 * @param l1RpcUrl - Optional L1 RPC URL
 * @returns Object containing the L1 transaction hash, Matrix transaction hash, FCT mint amount, and FCT mint rate
 * @throws Error if L1 chain is invalid, account is missing, or L2 chain is not configured
 */
export const sendRawMatrixTransaction = async (
  l1ChainId: number,
  account: Address,
  params: MatrixTransactionParams,
  sendL1Transaction: (l1Transaction: L1Transaction) => Promise<Hex>,
  l1RpcUrl?: string
) => {
  if (l1ChainId !== 56 && l1ChainId !== 97) {
    throw new Error("Invalid L1 chain");
  }

  if (!account) {
    throw new Error("No account");
  }

  const matrixPublicClient = createPublicClient({
    chain: l1ChainId === 56 ? matrixMainnet : matrixSepolia,
    transport: http(),
  });

  if (!matrixPublicClient.chain) {
    throw new Error("L2 chain not configured");
  }

  const [estimateGasRes, fctBalance, fctMintRate] = await Promise.all([
    matrixPublicClient.estimateGas({
      account,
      to: params.to,
      value: params.value,
      data: params.data,
      stateOverride: [{ address: account, balance: maxUint256 }],
    }),
    matrixPublicClient.getBalance({
      address: account,
    }),
    getFctMintRate(l1ChainId),
  ]);

  const gasLimit = estimateGasRes;

  const transactionData = [
    toHex(matrixPublicClient.chain.id),
    params.to ?? "0x",
    params.value ? toHex(params.value) : "0x",
    gasLimit ? toHex(gasLimit) : "0x",
    params.data ?? "0x",
    params.mineBoost ?? "0x",
  ];

  const encodedTransaction = concatHex([toHex(70), toRlp(transactionData)]);

  const inputCost = calculateInputGasCost(toBytes(encodedTransaction));
  const fctMintAmount = inputCost * fctMintRate;

  // Call estimateGas again but with an accurate future balance
  // This will allow it to correctly revert when necessary
  await matrixPublicClient.estimateGas({
    account,
    to: params.to,
    value: params.value,
    data: params.data,
    stateOverride: [
      {
        address: account,
        balance: fctBalance + fctMintAmount,
      },
    ],
  });

  const l1Transaction = {
    account,
    to: MATRIX_INBOX_ADDRESS,
    value: 0n,
    data: encodedTransaction,
    chainId: l1ChainId,
  };

  const l1TransportUrl =
    l1ChainId === 56
      ? "https://bsc-dataseed.binance.org"
      : "https://bsc-testnet.publicnode.com";

  const l1PublicClient = createPublicClient({
    chain: l1ChainId === 56 ? bsc : bscTestnet,
    transport: http(l1RpcUrl || l1TransportUrl),
  });
  const estimateL1Gas = await l1PublicClient.estimateGas(l1Transaction);

  const l1TransactionHash = await sendL1Transaction({
    ...l1Transaction,
    gas: estimateL1Gas,
  });

  const matrixTransactionHash = computeMatrixTransactionHash(
    l1TransactionHash,
    account,
    params.to ?? "0x",
    params.value ?? 0n,
    params.data ?? "0x",
    gasLimit,
    fctMintAmount
  );

  return {
    l1TransactionHash,
    matrixTransactionHash,
    fctMintAmount,
    fctMintRate,
  };
};
