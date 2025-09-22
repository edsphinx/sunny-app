import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

export const ContractInfo = () => {
  const { data: proofOfMatch } = useDeployedContractInfo({ contractName: "ProofOfMatch" });
  const { data: matchData } = useDeployedContractInfo({ contractName: "MatchData" });
  const { data: presenceScore } = useDeployedContractInfo({ contractName: "PresenceScore" });
  const { data: experienceNFT } = useDeployedContractInfo({ contractName: "ExperienceNFT" });
  const { data: commitmentVaultFactory } = useDeployedContractInfo({ contractName: "CommitmentVaultFactory" });
  const { data: commitmentVault } = useDeployedContractInfo({ contractName: "CommitmentVault" });

  const contracts = [
    { name: "ProofOfMatch (PoP SBTs)", data: proofOfMatch },
    { name: "MatchData (Compliance Levels)", data: matchData },
    { name: "ComplianceScore (Reputation)", data: presenceScore },
    { name: "CommitmentVaultFactory (RWA Factory)", data: commitmentVaultFactory },
    { name: "ExperienceNFT (RWA Voucher Example)", data: experienceNFT },
    { name: "CommitmentVault (RWA Escrow Logic)", data: commitmentVault },
  ];

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">🔗 Deployed Contracts (Arbitrum Sepolia)</h2>
        <div className="space-y-3 mt-2">
          {contracts.map(contract => (
            <div key={contract.name} className="flex flex-col gap-1 p-2 bg-base-200 rounded-md">
              <span className="font-semibold text-sm">{contract.name}</span>
              {contract.data ? (
                <Address address={contract.data.address} />
              ) : (
                <span className="loading loading-spinner loading-xs"></span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
