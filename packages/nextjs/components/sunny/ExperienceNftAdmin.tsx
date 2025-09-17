import { useState } from "react";
import Image from "next/image";
import type { TransactionReceipt } from "viem";
import { isAddress } from "viem";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useBackendWrite } from "~~/hooks/sunny/useBackendWrite";
import { useSunnyHistory } from "~~/hooks/sunny/useSunnyHistory";
import { notification } from "~~/utils/scaffold-eth";

export const ExperienceNftAdmin = () => {
  const [recipient, setRecipient] = useState("");
  const [tokenURI, setTokenURI] = useState("ipfs://bafkreibj6k67tdyperhb3dpfrhkxyxgcfhadcvlweegpcyovoe342zmmde");

  const { data: experienceNFTContract } = useDeployedContractInfo({ contractName: "ExperienceNFT" });

  const { writeContractAsync: mintExperience, isMining } = useBackendWrite("ExperienceNFT");

  /**
   * @notice Carga el historial de eventos para este contrato.
   * @dev Para este MVP, se buscan eventos solo en los últimos 10,000 bloques para evitar
   * sobrecargar el RPC de Alchemy y causar errores. Esta es una solución temporal
   * que asegura que la UI funcione sin entrar en bucles de peticiones fallidas.
   * @todo Reemplazar este mecanismo de sondeo del lado del cliente por una solución de
   * indexación dedicada y más robusta, como Ponder, Subsquid o The Graph. Un indexer
   * proporcionará una API mucho más rápida y eficiente para consultar datos históricos.
   */
  // @ts-ignore
  const {
    data: mintedNfts,
    isLoading: isLoadingNfts,
    refetch: refetchMintedNfts,
  } = useSunnyHistory({
    contractName: "ExperienceNFT",
    eventName: "Transfer",
    filters: { from: "0x0000000000000000000000000000000000000000" },
  });

  const handleMintExperience = async () => {
    if (!recipient || !isAddress(recipient)) {
      notification.error("Por favor, introduce una dirección de destinatario válida.");
      return;
    }
    try {
      await mintExperience(
        { functionName: "mintExperience", args: [recipient, tokenURI] },
        {
          onBlockConfirmation: (txnReceipt: TransactionReceipt) => {
            console.log(`📦 Experiencia acuñada en el bloque ${txnReceipt.blockNumber}! Iniciando actualización...`);
            // Le damos al nodo RPC (Alchemy) 1-2 segundos para que su estado interno
            // se sincronice y el nuevo evento esté disponible para ser consultado.
            setTimeout(() => {
              console.log("🔄 Ejecutando refetch para actualizar la lista de NFTs...");
              refetchMintedNfts();
            }, 2000); // 2 segundos de espera

            setRecipient("");
          },
        },
      );
    } catch (e) {
      console.error("Error al acuñar la experiencia:", e);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">1. Admin: Crear Experiencia NFT</h2>
        <p className="text-sm">Simula un negocio creando un voucher (RWA).</p>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Dirección del Comprador</span>
          </label>
          <AddressInput value={recipient} onChange={setRecipient} placeholder="Ej: 0x..." />
        </div>
        <div className="form-control mt-2">
          <label className="label">
            <span className="label-text">Token URI (Metadata)</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={tokenURI}
            onChange={e => setTokenURI(e.target.value)}
          />
        </div>
        <div className="card-actions justify-end mt-4">
          <button className="btn btn-primary" onClick={handleMintExperience} disabled={isMining}>
            {isMining ? <span className="loading loading-spinner"></span> : "Acuñar Experiencia"}
          </button>
        </div>
        <div className="divider my-1"></div>
        <p className="text-xs">
          Contrato: <span className="font-mono">{experienceNFTContract?.address}</span>
        </p>

        <h3 className="font-bold text-lg mt-2">Experiencias Creadas</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {isLoadingNfts && <span className="loading loading-spinner mx-auto"></span>}
          {[...(mintedNfts || [])].reverse().map((nft, index) => (
            // 2. CAMBIO: Modificamos el JSX de la lista para incluir la imagen
            <div key={index} className="p-3 bg-base-200 rounded-lg flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                <Image
                  src="/rwa_voucher_experience.png"
                  alt="Experience NFT Placeholder"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="flex-grow">
                <div className="text-sm font-mono flex justify-between items-center">
                  <span>
                    <b>Token ID:</b> {nft.args.tokenId?.toString()}
                  </span>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => navigator.clipboard.writeText(nft.args.tokenId?.toString() || "")}
                  >
                    Copiar
                  </button>
                </div>
                <div className="text-xs flex items-center">
                  <b>Dueño:</b> <Address address={nft.args.to as string} size="xs" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
