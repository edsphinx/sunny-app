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
   * @notice Loads the event history for this contract.
   * @dev For this MVP, events are fetched only from the last 10,000 blocks to prevent
   * overloading the Alchemy RPC and causing errors. This is a temporary solution
   * that ensures the UI functions without getting into failed request loops.
   * @todo Replace this client-side polling mechanism with a dedicated and more robust
   * indexing solution, such as Ponder, Subsquid, or The Graph. An indexer
   * will provide a much faster and more efficient API for querying historical data.
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
      notification.error("Please, write a valid recipient address.");
      return;
    }
    try {
      await mintExperience(
        { functionName: "mintExperience", args: [recipient, tokenURI] },
        {
          onBlockConfirmation: (txnReceipt: TransactionReceipt) => {
            console.log(`📦 Experience minted in block ${txnReceipt.blockNumber}! Initiating update...`);
            setTimeout(() => {
              console.log("🔄 Executing refetch to update NFTs list...");
              refetchMintedNfts();
            }, 2000); // 2 seconds wait

            setRecipient("");
          },
        },
      );
    } catch (e) {
      console.error("Error minting experience:", e);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">1. Admin: Mint Trial Access NFT</h2>
        <p className="text-sm">Simulates a sponsor minting a trial access voucher (RWA).</p>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Patient&apos;s Address</span>
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
            {isMining ? <span className="loading loading-spinner"></span> : "Mint Access NFT"}
          </button>
        </div>
        <div className="divider my-1"></div>
        <p className="text-xs">
          Contract: <span className="font-mono">{experienceNFTContract?.address}</span>
        </p>

        <h3 className="font-bold text-lg mt-2">Created Access NFTs</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {isLoadingNfts && <span className="loading loading-spinner mx-auto"></span>}
          {[...(mintedNfts || [])].reverse().map((nft, index) => (
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
                    Copy
                  </button>
                </div>
                <div className="text-xs flex items-center">
                  <b>Owner</b> <Address address={nft.args.to as string} size="xs" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
