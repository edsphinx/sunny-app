import { useState } from "react";
import { MatchLevel } from "./MatchLevel";
import type { TransactionReceipt } from "viem";
import { AddressInput } from "~~/components/scaffold-eth";
import { useBackendWrite } from "~~/hooks/sunny/useBackendWrite";
import { useSunnyHistory } from "~~/hooks/sunny/useSunnyHistory";

const formatAddress = (addr = ""): string => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export const MatchManager = () => {
  const [userA, setUserA] = useState("");
  const [userB, setUserB] = useState("");
  const [location, setLocation] = useState("Week 4 Check-in");
  const [selectedMatchId, setSelectedMatchId] = useState("");

  const { writeContractAsync: createMatch, isMining: isCreating } = useBackendWrite("ProofOfMatch");
  const { writeContractAsync: recordInteraction, isMining: isRecording } = useBackendWrite("MatchData");

  const {
    data: createdMatches,
    isLoading: isLoadingMatches,
    refetch: refetchMatches,
  } = useSunnyHistory({
    contractName: "ProofOfMatch",
    eventName: "MatchCreated",
  });

  const handleCreateMatch = async () => {
    if (!userA || !userB) {
      alert("Please fill in the addresses for both users.");
      return;
    }
    try {
      await createMatch(
        { functionName: "createMatch", args: [userA, userB, location] },
        {
          onBlockConfirmation: () => {
            console.log("🤝 Match created and confirmed! Initiating refresh...");

            setTimeout(() => {
              console.log("🔄 Fetching new match list...");
              refetchMatches();
            }, 2000); // 2 segundos de espera

            setUserA("");
            setUserB("");
          },
        },
      );
    } catch (e) {
      console.error("Error creating match:", e);
    }
  };

  const handleRecordInteraction = async () => {
    try {
      await recordInteraction(
        { functionName: "recordInteraction", args: [BigInt(selectedMatchId || 0)] },
        {
          onBlockConfirmation: (txnReceipt: TransactionReceipt) => {
            console.log("⚡️ Interaction recorded and confirmed!", txnReceipt.blockHash);
            refetchMatches();
          },
        },
      );
    } catch (e) {
      console.error("Error recording interaction:", e);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Clinic: Manage Interactions</h2>
        <div className="divider">Verify Clinical Visit</div>
        <AddressInput value={userA} onChange={setUserA} placeholder="Patient Address" />
        <AddressInput value={userB} onChange={setUserB} placeholder="Clinic/Institution Address" />
        <input
          type="text"
          className="input input-bordered mt-2"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
        <button className="btn btn-secondary mt-2" onClick={handleCreateMatch} disabled={isCreating}>
          {isCreating ? <span className="loading loading-spinner"></span> : "Verify Visit"}
        </button>

        <div className="divider">Verified Interactions</div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {isLoadingMatches && <span className="loading loading-spinner mx-auto"></span>}
          {[...(createdMatches || [])].reverse().map((match, index) => (
            <button
              key={index}
              className={`w-full text-left p-2 bg-base-200 rounded-lg hover:bg-base-300 border-2 ${
                selectedMatchId === match.args.matchId?.toString() ? "border-primary" : "border-transparent"
              }`}
              onClick={() => setSelectedMatchId(match.args.matchId?.toString() || "")}
            >
              <div className="flex justify-between items-center">
                <p className="text-sm font-mono flex items-center">
                  <b>Interaction ID:</b> {match.args.matchId?.toString()}
                </p>
                {match.args.matchId !== undefined && <MatchLevel matchId={match.args.matchId} />}
              </div>
              <p className="text-xs">
                <b>Participants:</b> {formatAddress(match.args.userA)} & {formatAddress(match.args.userB)}
              </p>
            </button>
          ))}
        </div>

        <div className="divider">Log Follow-up (Increases Compliance)</div>
        <input
          type="text"
          placeholder="Click an interaction from the list above"
          className="input input-bordered"
          value={selectedMatchId}
          readOnly
        />
        <button
          className="btn btn-accent mt-2"
          onClick={handleRecordInteraction}
          disabled={isRecording || !selectedMatchId}
        >
          {isRecording ? <span className="loading loading-spinner"></span> : "Confirm Interaction"}
        </button>
      </div>
    </div>
  );
};
