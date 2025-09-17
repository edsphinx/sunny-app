import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "ethers";

/**
 * @dev Despliega una instancia 'plantilla' de CommitmentVault.
 * El único propósito de este despliegue es hacer que el ABI del contrato
 * esté disponible para el frontend a través de los artefactos generados por Scaffold-ETH 2.
 * Esta instancia en sí no es funcional y no se utilizará directamente.
 */
const deployCommitmentVault: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Usamos valores dummy para el constructor, ya que esta instancia es solo una plantilla.
  const zeroAddress = ethers.ZeroAddress;

  await deploy("CommitmentVault", {
    from: deployer,
    // args: [address _userA, address _userB, address _nftAddress, uint256 _tokenId]
    args: [zeroAddress, zeroAddress, zeroAddress, 0],
    log: true,
    autoMine: true,
  });
};

export default deployCommitmentVault;
deployCommitmentVault.tags = ["CommitmentVault"];
