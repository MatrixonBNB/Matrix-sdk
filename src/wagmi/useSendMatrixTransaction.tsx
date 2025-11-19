"use client";

import { MutationOptions, useMutation } from "@tanstack/react-query";
import {
  getConnectorClient,
  ResolvedRegister,
  SendTransactionErrorType,
  SendTransactionParameters,
  SendTransactionReturnType,
} from "@wagmi/core";
import { Evaluate, Hex } from "viem";
import { bsc, bscTestnet } from "viem/chains";
import { Config, useConfig } from "wagmi";
import {
  SendTransactionData,
  SendTransactionMutate,
  SendTransactionMutateAsync,
  SendTransactionVariables,
  UseMutationParameters,
  UseMutationReturnType,
} from "wagmi/query";

import { sendMatrixTransaction } from "../viem/sendMatrixTransaction";

// Define the extended variables type with mineBoost
type SendMatrixTransactionVariables<
  config extends Config,
  chainId extends config["chains"][number]["id"],
> = SendTransactionVariables<config, chainId> & {
  mineBoost?: Hex;
};

async function sendTransaction<
  config extends Config,
  chainId extends config["chains"][number]["id"],
>(
  config: config,
  parameters: SendTransactionParameters<config, chainId> & {
    mineBoost?: Hex;
  }
): Promise<SendTransactionReturnType> {
  const {
    account,
    chainId,
    connector,
    gas: gas_,
    mineBoost,
    ...rest
  } = parameters;

  let client;
  if (typeof account === "object" && account?.type === "local")
    client = config.getClient({ chainId });
  else
    client = await getConnectorClient(config, { account, chainId, connector });

  if (client.chain.id !== bsc.id && client.chain.id !== bscTestnet.id) {
    throw new Error("Connect to bsc or bscTestnet");
  }

  const hash = await sendMatrixTransaction(client, {
    ...(rest as any),
    ...(account ? { account } : {}),
    chain: chainId ? { id: chainId } : null,
    mineBoost,
  });

  return hash;
}

function sendTransactionMutationOptions<config extends Config>(config: config) {
  return {
    mutationFn(variables) {
      return sendTransaction(config, variables);
    },
    mutationKey: ["sendTransaction"],
  } as const satisfies MutationOptions<
    SendTransactionData,
    SendTransactionErrorType,
    SendMatrixTransactionVariables<config, config["chains"][number]["id"]>
  >;
}

type ConfigParameter<config extends Config = Config> = {
  config?: Config | config | undefined;
};

type UseSendMatrixTransactionParameters<
  config extends Config = Config,
  context = unknown,
> = Evaluate<
  ConfigParameter<config> & {
    mutation?:
      | UseMutationParameters<
          SendTransactionData,
          SendTransactionErrorType,
          SendMatrixTransactionVariables<config, config["chains"][number]["id"]>,
          context
        >
      | undefined;
  }
>;

type UseSendMatrixTransactionReturnType<
  config extends Config = Config,
  context = unknown,
> = Evaluate<
  UseMutationReturnType<
    SendTransactionData,
    SendTransactionErrorType,
    SendMatrixTransactionVariables<config, config["chains"][number]["id"]>,
    context
  > & {
    sendMatrixTransaction: SendTransactionMutate<config, context>;
    sendMatrixTransactionAsync: SendTransactionMutateAsync<config, context>;
  }
>;

/**
 * Hook for sending Matrix transactions on bsc mainnet or bsc testnet.
 *
 * This hook provides a convenient way to send transactions through the Matrix SDK
 * using wagmi and viem. It supports both synchronous and asynchronous transaction
 * submission methods.
 *
 * @template config - The wagmi Config type
 * @template context - The mutation context type
 *
 * @param {UseSendMatrixTransactionParameters<config, context>} parameters - Configuration options
 * @param {config} [parameters.config] - The wagmi config to use
 * @param {UseMutationParameters} [parameters.mutation] - React Query mutation options
 *
 * @returns {UseSendMatrixTransactionReturnType<config, context>} - Mutation result and transaction methods
 * @returns {SendTransactionMutate<config, context>} returns.sendMatrixTransaction - Function to send a transaction
 * @returns {SendTransactionMutateAsync<config, context>} returns.sendMatrixTransactionAsync - Function to send a transaction that returns a promise
 *
 * @throws Will throw an error if connected to a chain other than bsc or bscTestnet
 *
 * @example
 * const { sendMatrixTransaction, isLoading, isSuccess, data } = useSendMatrixTransaction();
 *
 * // Send a transaction
 * sendMatrixTransaction({
 *   to: '0x...',
 *   value: parseEther('0.1'),
 *   data: '0x...',
 *   mineBoost: '0x01' // Optional: increase FCT mining amount
 * });
 */
export function useSendMatrixTransaction<
  config extends Config = ResolvedRegister["config"],
  context = unknown,
>(
  parameters: UseSendMatrixTransactionParameters<config, context> = {}
): UseSendMatrixTransactionReturnType<config, context> {
  const { mutation } = parameters;

  const config = useConfig(parameters);

  const mutationOptions = sendTransactionMutationOptions(config);
  const { mutate, mutateAsync, ...result } = useMutation({
    ...mutation,
    ...mutationOptions,
  });

  type Return = UseSendMatrixTransactionReturnType<config, context>;
  return {
    ...result,
    sendMatrixTransaction: mutate as Return["sendMatrixTransaction"],
    sendMatrixTransactionAsync:
      mutateAsync as Return["sendMatrixTransactionAsync"],
  };
}
