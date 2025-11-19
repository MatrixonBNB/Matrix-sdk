import {
  Abi,
  Account,
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
  Hex,
  SendTransactionParameters,
  SendTransactionRequest,
  SendTransactionReturnType,
  Transport,
  WalletClient,
  WriteContractParameters,
  WriteContractReturnType,
} from "viem";

import { MatrixTransactionParams } from "../types";
import { sendRawMatrixTransaction } from "../utils";
import { sendMatrixTransaction } from "./sendMatrixTransaction";
import { writeMatrixContract } from "./writeMatrixContract";

/**
 * Creates a set of L1 matrix actions bound to the provided wallet client
 * @param l1WalletClient - The viem wallet client for L1 interactions
 * @returns Object containing matrix transaction functions
 */
export const walletL1MatrixActions = <
  transport extends Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(
  l1WalletClient: WalletClient<transport, chain, account>
) => ({
  /**
   * Sends a transaction through the Matrix protocol using the bound L1 wallet client
   *
   * @param parameters - The transaction parameters
   * @returns A promise that resolves to the transaction hash
   */
  sendMatrixTransaction: <
    const request extends SendTransactionRequest<chain, chainOverride>,
    chainOverride extends Chain | undefined = undefined,
  >(
    parameters: SendTransactionParameters<
      chain,
      account,
      chainOverride,
      request
    > & { mineBoost?: Hex }
  ): Promise<SendTransactionReturnType> => {
    return sendMatrixTransaction(l1WalletClient, parameters);
  },

  /**
   * Sends a raw transaction through the Matrix protocol using the bound L1 wallet client
   *
   * @param parameters - The Matrix transaction parameters
   * @returns A promise that resolves to the transaction result containing L1 and Matrix transaction hashes
   */
  sendRawMatrixTransaction: (
    parameters: MatrixTransactionParams
  ): Promise<{
    l1TransactionHash: Hex;
    matrixTransactionHash: Hex;
    fctMintAmount: bigint;
    fctMintRate: bigint;
  }> => {
    if (!l1WalletClient.account) {
      throw new Error("No account");
    }
    if (!l1WalletClient.chain) {
      throw new Error("No chain");
    }

    return sendRawMatrixTransaction(
      l1WalletClient.chain.id,
      l1WalletClient.account.address,
      parameters,
      (l1Transaction) =>
        l1WalletClient.sendTransaction({
          ...l1Transaction,
          chain: l1WalletClient.chain as Chain | null | undefined,
          account: (l1WalletClient.account ?? l1Transaction.account) as Account,
        }),
      l1WalletClient.transport?.url
    );
  },

  /**
   * Writes to a contract through the Matrix protocol using the bound L1 wallet client
   *
   * @param parameters - The contract write parameters
   * @returns A promise that resolves to the transaction hash
   */
  writeMatrixContract: <
    const abi extends Abi | readonly unknown[],
    functionName extends ContractFunctionName<abi, "payable" | "nonpayable">,
    args extends ContractFunctionArgs<
      abi,
      "payable" | "nonpayable",
      functionName
    >,
    chainOverride extends Chain | undefined = undefined,
  >(
    parameters: WriteContractParameters<
      abi,
      functionName,
      args,
      chain,
      account,
      chainOverride
    > & { mineBoost?: Hex }
  ): Promise<WriteContractReturnType> => {
    return writeMatrixContract(l1WalletClient, parameters as any);
  },
});
