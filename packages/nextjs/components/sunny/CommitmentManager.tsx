import { useMemo, useState } from "react";
import type { TransactionReceipt } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { VaultCard } from "~~/components/sunny/VaultCard";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useSunnyHistory } from "~~/hooks/sunny/useSunnyHistory";
import { notification } from "~~/utils/scaffold-eth";

type SelectedNft = { address: string; tokenId: string };

export const CommitmentManager = () => {
  // === LÓGICA Y ESTADOS PARA LA CREACIÓN DE COMPROMISOS ===
  const [matchId, setMatchId] = useState("");
  const [selectedNft, setSelectedNft] = useState<SelectedNft | null>(null);
  const { address: connectedAddress } = useAccount();
  const { writeContractAsync: approve, isPending: isApproving } = useWriteContract();
  const { writeContractAsync: createVault, isMining: isCreating } = useScaffoldWriteContract({
    contractName: "CommitmentVaultFactory",
  });

  const { data: matchDetails, isLoading: isLoadingMatchDetails } = useScaffoldReadContract({
    contractName: "MatchData",
    functionName: "getMatchDetails",
    args: [BigInt(matchId || 0)],
    query: { enabled: !isNaN(parseInt(matchId)) && matchId.length > 0 },
  });

  const isEligible = matchDetails ? matchDetails.level >= 2 : false;
  const matchExists = matchDetails ? matchDetails.timestamp > 0n : false;

  const { data: experienceNftAbi } = useDeployedContractInfo({ contractName: "ExperienceNFT" });
  const { data: factoryContract } = useDeployedContractInfo({ contractName: "CommitmentVaultFactory" });

  const {
    data: allVaultEvents,
    isLoading: isLoadingVaults,
    refetch: refetchVaults,
  } = useSunnyHistory({
    contractName: "CommitmentVaultFactory",
    eventName: "VaultCreated",
  });

  const { data: allMintedNfts, isLoading: isLoadingNfts } = useSunnyHistory({
    contractName: "ExperienceNFT",
    eventName: "Transfer",
    filters: { from: "0x0000000000000000000000000000000000000000" },
  });

  const userOwnedNfts = useMemo(() => {
    if (!allMintedNfts || !connectedAddress) return [];
    return allMintedNfts.filter(nft => nft.args.to?.toLowerCase() === connectedAddress.toLowerCase());
  }, [allMintedNfts, connectedAddress]);

  // === HANDLERS (LÓGICA DE BOTONES) ===
  const handleApprove = async () => {
    if (!factoryContract || !experienceNftAbi || !selectedNft) {
      notification.error("Por favor, selecciona una experiencia NFT de la lista.");
      return;
    }
    try {
      await approve({
        address: selectedNft.address as `0x${string}`,
        abi: experienceNftAbi.abi,
        functionName: "approve",
        args: [factoryContract.address, BigInt(selectedNft.tokenId)],
      });
      notification.success("Aprobación exitosa!");
    } catch (e) {
      console.error("Error al aprobar:", e);
    }
  };

  const handleCreateVault = async () => {
    if (!selectedNft) {
      notification.error("Por favor, selecciona una experiencia NFT de la lista.");
      return;
    }
    try {
      await createVault(
        {
          functionName: "createCommitmentVault",
          args: [BigInt(matchId || 0), selectedNft.address, BigInt(selectedNft.tokenId)],
        },
        {
          onBlockConfirmation: (txnReceipt: TransactionReceipt) => {
            console.log("🏦 Bóveda de Compromiso creada!", txnReceipt.blockHash);
            notification.success("¡Bóveda de Compromiso creada!");
            setTimeout(() => refetchVaults(), 2000);
          },
        },
      );
    } catch (e) {
      console.error("Error al crear la bóveda:", e);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl col-span-1 lg:col-span-2">
      <div className="card-body">
        <h2 className="card-title text-3xl">Gestor de Compromisos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-xl font-semibold">Crear Nuevo Compromiso</h3>
              <p className="text-sm text-neutral-500">Asegura una experiencia en una bóveda para un match.</p>
            </div>

            <input
              type="text"
              placeholder="Pega el ID del Match aquí"
              className="input input-bordered"
              value={matchId}
              onChange={e => setMatchId(e.target.value)}
            />

            {matchId.length > 0 && isLoadingMatchDetails && (
              <div className="text-center">
                <span className="loading loading-spinner loading-sm"></span> Verificando nivel...
              </div>
            )}
            {matchId.length > 0 && matchExists && !isEligible && matchDetails && (
              <div role="alert" className="alert alert-warning">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="font-bold">Nivel Insuficiente</h3>
                  <div className="text-xs">
                    Este match es de <b>Nivel {matchDetails.level.toString()}</b>. Se requiere <b>Nivel 2</b>.
                  </div>
                </div>
              </div>
            )}

            <div className="divider text-sm">1. Selecciona tu Experiencia NFT</div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {isLoadingNfts && <span className="loading loading-spinner mx-auto"></span>}
              {userOwnedNfts.map((nft, index) => (
                <button
                  key={index}
                  className={`w-full text-left p-2 bg-base-300 rounded-lg hover:bg-primary hover:text-primary-content border-2 ${selectedNft?.tokenId === nft.args.tokenId?.toString() ? "border-primary" : "border-transparent"}`}
                  onClick={() => setSelectedNft({ address: nft.address, tokenId: nft.args.tokenId!.toString() })}
                >
                  <p className="text-sm font-mono">
                    <b>Token ID:</b> {nft.args.tokenId?.toString()}
                  </p>
                </button>
              ))}
              {!isLoadingNfts && userOwnedNfts.length === 0 && (
                <p className="text-center text-xs">No tienes Experiencias NFT en tu wallet.</p>
              )}
            </div>

            <div className="divider text-sm">2. Ejecuta los Pasos</div>
            <button
              className="btn btn-accent"
              onClick={handleApprove}
              disabled={isApproving || !selectedNft || !isEligible}
            >
              {isApproving ? <span className="loading loading-spinner"></span> : "Paso 1: Aprobar"}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateVault}
              disabled={isCreating || !selectedNft || !isEligible}
            >
              {isCreating ? <span className="loading loading-spinner"></span> : "Paso 2: Crear Bóveda"}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-xl font-semibold">
                {/* El título ahora es dinámico */}
                {connectedAddress ? "Actividad de Compromisos" : "Actividad del Protocolo"}
              </h3>
              <p className="text-sm text-neutral-500">
                {connectedAddress
                  ? "Se mostrarán solo las bóvedas en las que participas."
                  : "Todas las bóvedas creadas."}
              </p>
            </div>
            <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-2">
              {isLoadingVaults && <span className="loading loading-spinner mx-auto"></span>}

              {/* CAMBIO: Eliminamos el filtro 'userVaults' y mapeamos sobre TODOS los eventos.
                  La VaultCard se encargará de ocultarse si no eres participante. */}
              {[...(allVaultEvents || [])]
                .reverse()
                .map(
                  (event, index) =>
                    event.args.vaultAddress && <VaultCard key={index} vaultAddress={event.args.vaultAddress} />,
                )}

              {/* Mensaje de "vacío" genérico */}
              {!isLoadingVaults && (!allVaultEvents || allVaultEvents.length === 0) && (
                <p className="text-center text-neutral-500">No se han creado compromisos.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
