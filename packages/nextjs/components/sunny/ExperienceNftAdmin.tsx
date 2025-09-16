import { useState } from "react";
import type { TransactionReceipt } from "viem";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldEventHistory, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

type MintedNftEvent = {
  args: {
    from?: string;
    to?: string;
    tokenId?: bigint;
  };
};

export const ExperienceNftAdmin = () => {
  const [recipient, setRecipient] = useState("");
  const [tokenURI, setTokenURI] = useState(
    "ipfs://bafyreid7wvl5j45lsg4k5i2kfft33xy2gp5lwmpdfzakm2sh3hrrhiwg6a/metadata.json",
  );

  const { data: experienceNFTContract } = useDeployedContractInfo({ contractName: "ExperienceNFT" });

  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "ExperienceNFT",
  });

  // @ts-ignore
  const { data: mintedNfts, isLoading: isLoadingNfts } = useScaffoldEventHistory({
    contractName: "ExperienceNFT",
    eventName: "Transfer",
    fromBlock: 0n,
    filters: { from: "0x0000000000000000000000000000000000000000" },
    watch: true,
  });

  const handleMintExperience = async () => {
    try {
      // Ahora la llamada a 'writeContractAsync' funciona porque no le cambiamos el nombre.
      await writeContractAsync(
        { functionName: "mintExperience", args: [recipient, tokenURI] },
        {
          onBlockConfirmation: (txnReceipt: TransactionReceipt) => {
            console.log("📦 Experiencia acuñada!", txnReceipt.blockHash);
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
          {[...(mintedNfts || [])].reverse().map((nft: MintedNftEvent, index) => (
            <div key={index} className="p-2 bg-base-200 rounded-lg">
              <p className="text-sm font-mono flex justify-between">
                <span>
                  <b>Token ID:</b> {nft.args.tokenId?.toString()}
                </span>
                <button
                  className="btn btn-xs btn-ghost"
                  onClick={() => navigator.clipboard.writeText(nft.args.tokenId?.toString() || "")}
                >
                  Copiar
                </button>
              </p>
              <div className="text-xs flex items-center">
                <b>Dueño:</b> <Address address={nft.args.to as string} size="xs" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
