import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployCommitmentVaultFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const matchData = await hre.ethers.getContract("MatchData");

  await deploy("CommitmentVaultFactory", {
    from: deployer,
    // Argumentos del constructor: (address _matchDataAddress)
    args: [await matchData.getAddress()],
    log: true,
    autoMine: true,
  });
};

export default deployCommitmentVaultFactory;
deployCommitmentVaultFactory.tags = ["CommitmentVaultFactory"];
deployCommitmentVaultFactory.dependencies = ["MatchData"];
