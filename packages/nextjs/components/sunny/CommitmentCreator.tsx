import { useMemo, useState } from "react";
import type { TransactionReceipt } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldEventHistory, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// Tipo para el evento de Transferencia del NFT
type NftTransferEvent = {
  address: string;
  args: {
    to?: string;
    tokenId?: bigint;
  };
};

// Tipo para el NFT seleccionado
type SelectedNft = {
  address: string;
  tokenId: string;
};

export const CommitmentCreator = () => {
  const [matchId, setMatchId] = useState("");
  const [selectedNft, setSelectedNft] = useState<SelectedNft | null>(null);

  // Hook para obtener la dirección del usuario conectado
  const { address: connectedAddress } = useAccount();

  // Obtenemos info de los contratos que necesitamos
  const { data: experienceNftAbi } = useDeployedContractInfo({ contractName: "ExperienceNFT" });
  const { data: factoryContract } = useDeployedContractInfo({ contractName: "CommitmentVaultFactory" });

  // Hook de wagmi para la función 'approve' (dirección dinámica)
  const { writeContractAsync: approve, isPending: isApproving } = useWriteContract();

  // Hook de Scaffold para la función 'createVault' (dirección fija)
  const { writeContractAsync: createVault, isMining: isCreating } = useScaffoldWriteContract({
    contractName: "CommitmentVaultFactory",
  });

  // Buscamos TODOS los eventos de mint de ExperienceNFTs

  // @ts-ignore
  const { data: allMintedNfts, isLoading: isLoadingNfts } = useScaffoldEventHistory({
    contractName: "ExperienceNFT",
    eventName: "Transfer",
    fromBlock: 0n,
    filters: { from: "0x0000000000000000000000000000000000000000" },
    watch: true,
  });

  // Usamos useMemo para filtrar y mostrar solo los NFTs que posee el usuario conectado
  const userOwnedNfts = useMemo(() => {
    if (!allMintedNfts || !connectedAddress) return [];
    return allMintedNfts.filter(
      (nft: NftTransferEvent) => nft.args.to?.toLowerCase() === connectedAddress.toLowerCase(),
    );
  }, [allMintedNfts, connectedAddress]);

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
            console.log("🏦 Bóveda creada!", txnReceipt.blockHash);
            notification.success("¡Bóveda de Compromiso creada!");
          },
        },
      );
    } catch (e) {
      console.error("Error al crear la bóveda:", e);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">3. Usuario: Crear Bóveda de Compromiso</h2>
        <div className="text-sm font-mono bg-base-200 p-3 rounded-md space-y-1">
          <p>
            <b>1.</b> Copia un <b>Match ID</b> de la lista de &quot;Gestionar Matches&quot;.
          </p>
          <p>
            <b>2.</b> Selecciona una de <b>tus Experiencias NFT</b> de la lista de abajo.
          </p>
          <p>
            <b>3.</b> Ejecuta los 2 pasos: Aprobar y Crear.
          </p>
        </div>

        <input
          type="text"
          placeholder="Pega el ID del Match aquí"
          className="input input-bordered mt-4"
          value={matchId}
          onChange={e => setMatchId(e.target.value)}
        />

        <div className="divider">Tus Experiencias NFT Disponibles</div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {isLoadingNfts && <span className="loading loading-spinner mx-auto"></span>}
          {userOwnedNfts.map((nft: NftTransferEvent, index) => (
            <button
              key={index}
              className={`w-full text-left p-2 bg-base-200 rounded-lg hover:bg-base-300 border-2 ${
                selectedNft?.tokenId === nft.args.tokenId?.toString() ? "border-primary" : "border-transparent"
              }`}
              onClick={() => setSelectedNft({ address: nft.address, tokenId: nft.args.tokenId!.toString() })}
            >
              <p className="text-sm font-mono">
                <b>Token ID:</b> {nft.args.tokenId?.toString()}
              </p>
              <div className="text-xs flex items-center">
                <b>Contrato:</b> <Address address={nft.address} size="xs" />
              </div>
            </button>
          ))}
          {!isLoadingNfts && userOwnedNfts.length === 0 && (
            <p className="text-center text-xs">No se encontraron Experiencias NFT en tu wallet.</p>
          )}
        </div>

        <div className="divider">Ejecutar Pasos</div>
        <button className="btn btn-accent mt-1" onClick={handleApprove} disabled={isApproving || !selectedNft}>
          {isApproving ? <span className="loading loading-spinner"></span> : "Paso 1: Aprobar"}
        </button>
        <button className="btn btn-primary mt-2" onClick={handleCreateVault} disabled={isCreating || !selectedNft}>
          {isCreating ? <span className="loading loading-spinner"></span> : "Paso 2: Crear Bóveda"}
        </button>
      </div>
    </div>
  );
};
