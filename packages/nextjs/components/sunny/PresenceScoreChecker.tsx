import { useMemo, useState } from "react";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const PresenceScoreChecker = () => {
  const [addressToCheck, setAddressToCheck] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");

  const {
    data: score,
    refetch,
    isFetching,
  } = useScaffoldReadContract({
    contractName: "PresenceScore",
    functionName: "getPresenceScore",
    args: [addressToCheck],
    query: { enabled: false },
  });

  // @ts-ignore
  const { data: createdMatches, isLoading: isLoadingMatches } = useScaffoldEventHistory({
    contractName: "ProofOfMatch",
    eventName: "MatchCreated",
    fromBlock: 0n,
    watch: true,
  });

  const uniqueAddresses = useMemo(() => {
    if (!createdMatches) return [];
    const allAddresses = createdMatches.flatMap(m => [m.args.userA, m.args.userB]);
    return [...new Set(allAddresses.filter((addr): addr is string => !!addr))];
  }, [createdMatches]);

  const handleCheckScore = (address: string) => {
    setAddressToCheck(address);
    setSelectedAddress(address);
    setTimeout(() => refetch(), 100);
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">4. Público: Verificar Presence Score</h2>
        <p className="text-sm">Haz clic en una dirección de la lista para ver su puntuación.</p>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 mt-4">
          {isLoadingMatches && <span className="loading loading-spinner mx-auto"></span>}
          {uniqueAddresses.map((address, index) => (
            // CAMBIO: Cambiamos <button> por <div> y le damos las clases de un botón.
            <div
              key={index}
              className={`btn btn-outline w-full justify-start ${selectedAddress === address ? "btn-active" : ""}`}
              onClick={() => handleCheckScore(address)}
              // Añadimos role y tabIndex por accesibilidad
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
