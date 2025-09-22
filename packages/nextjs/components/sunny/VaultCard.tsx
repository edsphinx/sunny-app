import type { Address as ViemAddress } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";
import { useBackendWrite } from "~~/hooks/sunny/useBackendWrite";
import { notification } from "~~/utils/scaffold-eth";

type VaultCardProps = {
  vaultAddress: string;
};

export const VaultCard = ({ vaultAddress }: VaultCardProps) => {
  console.log("[VaultCard]", vaultAddress);
  const { address: connectedAddress, chain } = useAccount();
  const { writeContractAsync: vaultAction, isPending } = useWriteContract();

  const { checkAndExecute, isExecuting } = useBackendWrite("CommitmentVault");

  const chainId = chain?.id as keyof typeof deployedContracts | undefined;
  const commitmentVaultAbi = chainId ? deployedContracts[chainId]?.CommitmentVault?.abi : undefined;

  const readConfig = {
    address: vaultAddress as `0x${string}`,
    abi: commitmentVaultAbi,
    chainId: chainId,
    query: {
      enabled: !!commitmentVaultAbi && !!chainId,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  };

  const { data: userA, isLoading: isLoadingA } = useReadContract({ ...readConfig, functionName: "userA" });
  const { data: userB, isLoading: isLoadingB } = useReadContract({ ...readConfig, functionName: "userB" });
  const { data: isRedeemed, refetch: refetchIsRedeemed } = useReadContract({
    ...readConfig,
    functionName: "isRedeemed",
  });
  const { data: isDissolved, refetch: refetchIsDissolved } = useReadContract({
    ...readConfig,
    functionName: "isDissolved",
  });

  const { data: userA_dissolve, refetch: refetch_userA_dissolve } = useReadContract({
    ...readConfig,
    functionName: "dissolutionApprovals",
    args: [userA!],
    query: { enabled: !!userA },
  });
  const { data: userB_dissolve, refetch: refetch_userB_dissolve } = useReadContract({
    ...readConfig,
    functionName: "dissolutionApprovals",
    args: [userB!],
    query: { enabled: !!userB },
  });
  const { data: userB_redeem, refetch: refetch_userB_redeem } = useReadContract({
    ...readConfig,
    functionName: "redemptionApprovals",
    args: [userB!],
    query: { enabled: !!userB },
  });

  if (isLoadingA || isLoadingB) {
    return <div className="skeleton h-32 w-full"></div>;
  }

  if (!chain || !connectedAddress) {
    return (
      <div className="p-4 bg-base-200 rounded-lg text-center">
        <p>Conect your wallet to see the details of the commitment.</p>
      </div>
    );
  }

  if (!commitmentVaultAbi) {
    return (
      <div className="p-4 bg-base-200 rounded-lg text-center text-error">
        <p>The contract CommitmentVault still not deploy on current network ({chain.name}).</p>
      </div>
    );
  }

  const handleVaultAction = async (functionName: "approveRedemption" | "approveDissolution") => {
    try {
      await vaultAction({
        address: vaultAddress as `0x${string}`,
        abi: commitmentVaultAbi,
        functionName: functionName,
      });
      notification.success("¡Approvation Sent! Refresing state...");

      setTimeout(() => {
        refetchIsRedeemed();
        refetchIsDissolved();
        refetch_userA_dissolve();
        refetch_userB_dissolve();
        refetch_userB_redeem();

        checkAndExecute({ vaultAddress });
      }, 3000);
    } catch (e) {
      console.error(`Error approving ${functionName}`, e);
      notification.error("Error occured sending your approval.");
    }
  };

  const status = isRedeemed ? "Redeemed ✅" : isDissolved ? "Dissolved ❌" : "Active ⏳";

  console.log("VERIFYING ROLES:", {
    "Wallet Conected": connectedAddress?.toLowerCase(),
    "User A from Contract": (userA as ViemAddress)?.toLowerCase(),
    "User B from Contract": (userB as ViemAddress)?.toLowerCase(),
  });

  const role =
    connectedAddress?.toLowerCase() === (userA as ViemAddress)?.toLowerCase()
      ? "creator"
      : connectedAddress?.toLowerCase() === (userB as ViemAddress)?.toLowerCase()
        ? "recipient"
        : "viewer";

  return (
    <div className="p-4 bg-base-200 rounded-lg space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-mono text-sm">
          <Address address={vaultAddress} />
        </span>
        <span className={`badge ${isRedeemed ? "badge-success" : isDissolved ? "badge-error" : "badge-info"}`}>
          {status}
        </span>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-1">
          <b>Creator (userA):</b> <Address address={userA as string} size="xs" />
        </div>
        <div className="flex items-center gap-1">
          <b>Recipient (userB):</b> <Address address={userB as string} size="xs" />
        </div>
      </div>

      {!isRedeemed && !isDissolved && role !== "viewer" && (
        <div className="border-t border-base-300 pt-3 mt-3 space-y-2">
          <p className="text-xs font-semibold">Actions Available for you ({role}):</p>
          <div className="flex flex-wrap gap-2">
            {role === "recipient" &&
              (!!userB_redeem ? (
                <span className="text-xs italic text-success">✓ Approved Redemption</span>
              ) : (
                <button
                  className="btn btn-xs btn-success btn-outline"
                  disabled={isPending || isExecuting}
                  onClick={() => handleVaultAction("approveRedemption")}
                >
                  {isPending || isExecuting ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "Approve Redemption"
                  )}
                </button>
              ))}

            {((role === "creator" && !userA_dissolve) || (role === "recipient" && !userB_dissolve)) && (
              <button
                className="btn btn-xs btn-warning btn-outline"
                disabled={isPending || isExecuting}
                onClick={() => handleVaultAction("approveDissolution")}
              >
                {isPending || isExecuting ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "Approve Dissolution"
                )}
              </button>
            )}

            {((role === "creator" && !!userA_dissolve) || (role === "recipient" && !!userB_dissolve)) && (
              <span className="text-xs italic text-warning">✓ Approved Dissolution</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
