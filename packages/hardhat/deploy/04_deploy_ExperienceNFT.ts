import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployExperienceNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("ExperienceNFT", {
    from: deployer,
    // Argumentos del constructor: (string memory name, string memory symbol, address initialOwner)
    args: ["Cena en Restaurante Fusión", "CRF", deployer],
    log: true,
    autoMine: true,
  });
};

export default deployExperienceNFT;
deployExperienceNFT.tags = ["ExperienceNFT"];
