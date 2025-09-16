import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployPresenceScore: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Obtenemos los contratos de los que depende
  const proofOfMatch = await hre.ethers.getContract("ProofOfMatch");
  const matchData = await hre.ethers.getContract("MatchData");

  await deploy("PresenceScore", {
    from: deployer,
    // Argumentos del constructor: (address _proofOfMatchAddress, address _matchDataAddress)
    args: [await proofOfMatch.getAddress(), await matchData.getAddress()],
    log: true,
    autoMine: true,
  });
};

export default deployPresenceScore;
deployPresenceScore.tags = ["PresenceScore"];
deployPresenceScore.dependencies = ["ProofOfMatch", "MatchData"];
