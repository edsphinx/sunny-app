import { useQuery } from "@tanstack/react-query";
import { type AbiEvent, type ExtractAbiEventNames } from "abitype";
import { usePublicClient } from "wagmi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { ContractAbi, ContractName } from "~~/utils/scaffold-eth/contract";

type UseSimpleEventHistoryConfig<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
> = {
  contractName: TContractName;
  eventName: TEventName;
  fromBlock: bigint;
  filters?: any;
  enabled?: boolean;
};

/**
 * @notice Hook simplificado para leer el historial de eventos en un rango específico.
 * @dev A diferencia de useScaffoldEventHistory, este hook no usa paginación y realiza una
 * única llamada 'getLogs', lo que evita bucles infinitos en ciertas condiciones.
 * Es ideal para cargar listas de eventos de un tamaño manejable.
 */
export const useSimpleEventHistory = <
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
>({
  contractName,
  eventName,
  fromBlock,
  filters,
  enabled = true,
}: UseSimpleEventHistoryConfig<TContractName, TEventName>) => {
  const publicClient = usePublicClient();
  const { data: deployedContractData } = useDeployedContractInfo({ contractName });

  return useQuery({
    queryKey: ["simpleEventHistory", contractName, eventName, fromBlock.toString(), JSON.stringify(filters)],
    queryFn: async () => {
      if (!publicClient || !deployedContractData) {
        return [];
      }
      const event = deployedContractData.abi.find(part => part.type === "event" && part.name === eventName) as
        | AbiEvent
        | undefined;

      return await publicClient.getLogs({
        address: deployedContractData.address,
        event: event,
        args: filters,
        fromBlock,
        toBlock: "latest",
      });
    },
    enabled: enabled && !!publicClient && !!deployedContractData && fromBlock > 0n,
  });
};
