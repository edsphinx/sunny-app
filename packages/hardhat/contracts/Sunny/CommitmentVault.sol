// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title Commitment Vault
 * @author edsphinx
 * @dev Contiene un ExperienceNFT como promesa. Requiere acuerdo de ambos para actuar.
 */
contract CommitmentVault is ERC721Holder {
    address public immutable userA; // Quien crea el compromiso
    address public immutable userB; // Quien recibe el compromiso
    address public immutable experienceNFTAddress;
    uint256 public immutable experienceTokenId;

    bool public isRedeemed;
    bool public isDissolved;

    mapping(address => bool) public redemptionApprovals;
    mapping(address => bool) public dissolutionApprovals;

    event Redeemed(address indexed redeemedBy);
    event Dissolved(address indexed returnedTo);

    modifier onlyParticipants() {
        require(msg.sender == userA || msg.sender == userB, "Not a participant");
        _;
    }

    constructor(address _userA, address _userB, address _nftAddress, uint256 _tokenId) {
        userA = _userA;
        userB = _userB;
        experienceNFTAddress = _nftAddress;
        experienceTokenId = _tokenId;
    }

    /**
     * @notice Un participante aprueba el canje de la experiencia.
     */
    function approveRedemption() external onlyParticipants {
        redemptionApprovals[msg.sender] = true;
    }

    /**
     * @notice Canjea la experiencia si ambos han aprobado. Transfiere el NFT a quien lo ejecuta.
     */
    function executeRedemption() external onlyParticipants {
        require(redemptionApprovals[userA] && redemptionApprovals[userB], "Both must approve");
        require(!isRedeemed && !isDissolved, "Vault is settled");
        isRedeemed = true;
        IERC721(experienceNFTAddress).safeTransferFrom(address(this), msg.sender, experienceTokenId);
        emit Redeemed(msg.sender);
    }

    /**
     * @notice Un participante aprueba la disolución del compromiso.
     */
    function approveDissolution() external onlyParticipants {
        dissolutionApprovals[msg.sender] = true;
    }

    /**
     * @notice Disuelve el compromiso y devuelve el NFT al comprador original si ambos aprueban.
     */
    function executeDissolution() external onlyParticipants {
        require(dissolutionApprovals[userA] && dissolutionApprovals[userB], "Both must approve");
        require(!isRedeemed && !isDissolved, "Vault is settled");
        isDissolved = true;
        IERC721(experienceNFTAddress).safeTransferFrom(address(this), userA, experienceTokenId);
        emit Dissolved(userA);
    }
}
