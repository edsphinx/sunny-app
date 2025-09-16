import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployMatchData: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Obtenemos el contrato ProofOfMatch ya desplegado
  const proofOfMatch = await hre.ethers.getContract<Contract>("ProofOfMatch", deployer);
  const proofOfMatchAddress = await proofOfMatch.getAddress();

  await deploy("MatchData", {
    from: deployer,
    // Argumentos del constructor: (address _proofOfMatchAddress, address _ownerAddress)
    args: [proofOfMatchAddress, deployer],
    log: true,
    autoMine: true,
  });

  // --- Enlazar los contratos ---
  console.log("🔗 Enlazando ProofOfMatch con MatchData...");
  const matchData = await hre.ethers.getContract<Contract>("MatchData", deployer);
  await proofOfMatch.setMatchDataContract(await matchData.getAddress());
  console.log("✅ Contratos enlazados exitosamente!");
};

export default deployMatchData;
deployMatchData.tags = ["MatchData"];
// Le decimos a hardhat-deploy que este script depende del despliegue de ProofOfMatch
deployMatchData.dependencies = ["ProofOfMatch"];
