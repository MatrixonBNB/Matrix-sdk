"use client";

import { MutationOptions, useMutation } from "@tanstack/react-query";
import {
  Config,
  getConnectorClient,
  ResolvedRegister,
  simulateContract,
  WriteContractParameters,
  WriteContractReturnType,
} from "@wagmi/core";
import {
  Abi,
  ContractFunctionArgs,
  ContractFunctionName,
  Hex,
  WriteContractErrorType,
} from "viem";
import { bsc, bscTestnet } from "viem/chains";
import { useConfig } from "wagmi";
import {
  UseMutationParameters,
  UseMutationReturnType,
  WriteContractData,
  WriteContractMutate,
  WriteContractMutateAsync,
  WriteContractVariables,
} from "wagmi/query";

import { writeMatrixContract as viemWriteMatrixContract } from "../viem/writeMatrixContract";

// Define the extended variables type with mineBoost
type WriteMatrixContractVariables<
  abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, "nonpayable" | "payable">,
  args extends ContractFunctionArgs<
    abi,
    "nonpayable" | "payable",
    functionName
  >,
  config extends Config,
  chainId extends config["chains"][number]["id"],
> = WriteContractVariables<abi, functionName, args, config, chainId> & {
  mineBoost?: Hex;
};

async function writeMatrixContract<
  config extends Config,
  const abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, "nonpayable" | "payable">,
  args extends ContractFunctionArgs<
    abi,
    "nonpayable" | "payable",
    functionName
  >,
  chainId extends config["chains"][number]["id"],
>(
  config: config,
  parameters: WriteContractParameters<
    abi,
    functionName,
    args,
    config,
    chainId
  > & {
    mineBoost?: Hex;
  }
): Promise<WriteContractReturnType> {
  const { account, chainId, connector, mineBoost, __mode, ...rest } =
    parameters;

  let client;
  if (typeof account === "object" && account?.type === "local")
    client = config.getClient({ chainId });
  else
    client = await getConnectorClient(config, {
      account: account ?? undefined,
      chainId,
      connector,
    });

  if (client.chain.id !== bsc.id && client.chain.id !== bscTestnet.id) {
    throw new Error("Connect to bsc or bscTestnet");
  }

  let request;
  if (__mode === "prepared") request = rest;
  else {
    const { request: simulateRequest } = await simulateContract(config, {
      ...rest,
      account,
      chainId: client.chain.id === bsc.id ? 0xbbbb1 : 0xbbbb2,
    } as any);
    request = simulateRequest;
  }

  const hash = await viemWriteMatrixContract(client, {
    ...(request as any),
    ...(account ? { account } : {}),
    chain: chainId ? { id: chainId } : null,
    mineBoost,
  });

  return hash;
}

function writeMatrixContractMutationOptions<config extends Config>(
  config: config
) {
  return {
    mutationFn(variables) {
      return writeMatrixContract(config, variables);
    },
    mutationKey: ["writeMatrixContract"],
  } as const satisfies MutationOptions<
    WriteContractData,
    WriteContractErrorType,
    WriteMatrixContractVariables<
      Abi,
      string,
      readonly unknown[],
      config,
      config["chains"][number]["id"]
    >
  >;
}

type ConfigParameter<config extends Config = Config> = {
  config?: Config | config | undefined;
};

type UseWriteMatrixContractParameters<
  config extends Config = Config,
  context = unknown,
> = ConfigParameter<config> & {
  mutation?:
    | UseMutationParameters<
        WriteContractData,
        WriteContractErrorType,
        WriteMatrixContractVariables<
          Abi,
          string,
          readonly unknown[],
          config,
          config["chains"][number]["id"]
        >,
        context
      >
    | undefined;
};

type UseWriteMatrixContractReturnType<
  config extends Config = Config,
  context = unknown,
> = UseMutationReturnType<
  WriteContractData,
  WriteContractErrorType,
  WriteMatrixContractVariables<
    Abi,
    string,
    readonly unknown[],
    config,
    config["chains"][number]["id"]
  >,
  context
> & {
  writeMatrixContract: WriteContractMutate<config, context>;
  writeMatrixContractAsync: WriteContractMutateAsync<config, context>;
};

/**
 * React hook that provides functionality to write to a Matrix contract.
 *
 * @template config - The wagmi Config type, defaults to ResolvedRegister["config"]
 * @template context - The context type for the mutation, defaults to unknown
 *
 * @param {UseWriteMatrixContractParameters<config, context>} parameters - Configuration options
 * @param {Config | config | undefined} [parameters.config] - Optional wagmi configuration
 * @param {UseMutationParameters} [parameters.mutation] - Optional react-query mutation parameters
 *
 * @returns {UseWriteMatrixContractReturnType<config, context>} Object containing:
 *   - writeMatrixContract: Function to execute the contract write (non-async)
 *   - writeMatrixContractAsync: Function to execute the contract write (async)
 *   - Additional react-query mutation properties (isLoading, isSuccess, etc.)
 */
export function useWriteMatrixContract<
  config extends Config = ResolvedRegister["config"],
  context = unknown,
>(
  parameters: UseWriteMatrixContractParameters<config, context> = {}
): UseWriteMatrixContractReturnType<config, context> {
  const { mutation } = parameters;

  const config = useConfig(parameters);

  const mutationOptions = writeMatrixContractMutationOptions(config);

  const { mutate, mutateAsync, ...result } = useMutation({
    ...mutation,
    ...mutationOptions,
  });

  type Return = UseWriteMatrixContractReturnType<config, context>;
  return {
    ...result,
    writeMatrixContract: mutate as Return["writeMatrixContract"],
    writeMatrixContractAsync: mutateAsync as Return["writeMatrixContractAsync"],
  };
}
