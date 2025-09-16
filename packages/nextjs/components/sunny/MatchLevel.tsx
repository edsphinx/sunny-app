import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type MatchLevelProps = {
  matchId: bigint;
};

export const MatchLevel = ({ matchId }: MatchLevelProps) => {
  const { data: matchDetails, isFetching } = useScaffoldReadContract({
    contractName: "MatchData",
    functionName: "getMatchDetails",
    args: [matchId],
    watch: true,
  });

  if (isFetching) {
    return <span className="loading loading-spinner loading-xs"></span>;
  }

  return (
    <span
      className={`badge ${matchDetails?.level === 2 ? "badge-accent" : ""} ${
        matchDetails?.level && matchDetails.level >= 3 ? "badge-primary" : ""
      }`}
    >
      Nivel: {matchDetails?.level?.toString() || "1"}
    </span>
  );
};
