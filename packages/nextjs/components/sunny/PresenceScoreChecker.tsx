import { useMemo, useState } from "react";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useSunnyHistory } from "~~/hooks/sunny/useSunnyHistory";

export const PresenceScoreChecker = () => {
  const [addressToCheck, setAddressToCheck] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");

  const { data: score, isFetching } = useScaffoldReadContract({
    contractName: "PresenceScore",
    functionName: "getPresenceScore",
    args: [addressToCheck],
    query: {
      enabled: addressToCheck !== "",
    },
  });

  /**
   * @notice Carga la lista de usuarios que han participado en matches.
   * @dev Para este MVP, se hizo solo como una solución temporal.
   * @todo Reemplazar este mecanismo por una solución de indexación.
   */
  const { data: createdMatches, isLoading: isLoadingMatches } = useSunnyHistory({
    contractName: "ProofOfMatch",
    eventName: "MatchCreated",
  });

  const uniqueAddresses = useMemo(() => {
    if (!createdMatches) return [];
    const allAddresses = createdMatches.flatMap(m => [m.args.userA, m.args.userB]);
    return [...new Set(allAddresses.filter((addr): addr is string => !!addr))];
  }, [createdMatches]);

  const handleCheckScore = (address: string) => {
    setAddressToCheck(address);
    setSelectedAddress(address);
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">4. Public: Verify Compliance Score</h2>
        <p className="text-sm">Click an address from the list to see its score.</p>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 mt-4">
          {isLoadingMatches && <span className="loading loading-spinner mx-auto"></span>}
          {uniqueAddresses.map((address, index) => (
            <div
              key={index}
              className={`btn btn-outline w-full justify-start ${selectedAddress === address ? "btn-active" : ""}`}
              onClick={() => handleCheckScore(address)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && handleCheckScore(address)}
            >
              <Address address={address} />
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          {isFetching && <span className="loading loading-spinner"></span>}
          {score !== undefined && !isFetching && (
            <div className="stats bg-primary text-primary-content">
              <div className="stat">
                <div className="stat-title">Puntuación de</div>
                <div className="stat-value">{score.toString()}</div>
                <div className="stat-desc">
                  <Address address={selectedAddress} size="xs" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
