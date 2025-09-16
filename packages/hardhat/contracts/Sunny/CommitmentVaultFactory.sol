// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IMatchData } from "./IMatchData.sol";
import { CommitmentVault } from "./CommitmentVault.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title Commitment Vault Factory
 * @author edsphinx
 * @dev Contrato para que las parejas creen sus propias Bóvedas de Compromisos.
 */
contract CommitmentVaultFactory {
    IMatchData public matchDataContract;
    mapping(uint256 => address) public matchIdToVault;

    event VaultCreated(uint256 indexed matchId, address vaultAddress, address indexed creator);

    constructor(address _matchDataAddress) {
        matchDataContract = IMatchData(_matchDataAddress);
    }

    /**
     * @notice Crea una Bóveda de Compromisos para un match.
     * @dev Verifica que el nivel del match sea 2 o superior.
     * El llamador debe ser parte del match y ser el dueño del ExperienceNFT.
     */
    function createCommitmentVault(
        uint256 _matchId,
        address _experienceNFTAddress,
        uint256 _experienceTokenId
    ) external {
        // --- Verificaciones de Seguridad ---
        require(matchIdToVault[_matchId] == address(0), "Vault already exists for this match");

        IMatchData.Match memory currentMatch = matchDataContract.getMatchDetails(_matchId);
        require(currentMatch.timestamp != 0, "Match does not exist");
        require(currentMatch.level >= 2, "Match level must be 2 or higher");

        address userA = msg.sender;
        address userB;
        if (userA == currentMatch.userA) {
            userB = currentMatch.userB;
        } else if (userA == currentMatch.userB) {
            userB = currentMatch.userA;
        } else {
            revert("You are not part of this match");
        }

        // --- Creación y Transferencia ---
        CommitmentVault newVault = new CommitmentVault(userA, userB, _experienceNFTAddress, _experienceTokenId);
        matchIdToVault[_matchId] = address(newVault);

        // Transfiere el NFT del usuario a la nueva bóveda
        IERC721(_experienceNFTAddress).safeTransferFrom(msg.sender, address(newVault), _experienceTokenId);

        emit VaultCreated(_matchId, address(newVault), msg.sender);
    }
}
