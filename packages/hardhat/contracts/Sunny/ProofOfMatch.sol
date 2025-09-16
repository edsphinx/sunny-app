// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { IMatchData } from "./IMatchData.sol";
import { IProofOfMatch } from "./IProofOfMatch.sol";

/**
 * @title Proof of Match (PoM)
 * @author edsphinx
 * @notice Contrato para acuñar Soulbound Tokens (SBTs) que representan un match verificado
 * en el mundo real entre dos personas. Este es el contrato central de registro de tokens.
 * @dev Hereda de ERC721 y Ownable. Implementa la interfaz IProofOfMatch.
 * Se encarga de la acuñación y la lógica Soulbound, delegando el almacenamiento de datos
 * a un contrato MatchData.
 */
contract ProofOfMatch is ERC721, Ownable, IProofOfMatch {
    // --- State Variables ---
    uint256 private _nextTokenId;
    uint256 private _nextMatchId;
    mapping(address => mapping(address => bool)) public matchExists;
    mapping(uint256 => uint256) public tokenToMatchId;

    mapping(address => uint256[]) private _userTokens;
    mapping(uint256 => uint256) private _tokenIndex;

    /**
     * @notice La dirección del contrato MatchData que almacena los detalles de los niveles.
     */
    IMatchData public matchDataContract;

    // --- Constructor ---
    constructor() ERC721("Proof of Match", "MATCH") Ownable(msg.sender) {}

    // --- Admin Functions ---

    /**
     * @notice Establece la dirección del contrato de datos (MatchData).
     * @dev Debe ser llamado por el owner antes de poder crear matches.
     * @param _contractAddress La dirección del contrato MatchData desplegado.
     */
    function setMatchDataContract(address _contractAddress) public onlyOwner {
        matchDataContract = IMatchData(_contractAddress);
    }

    // --- Core Functions ---

    /**
     * @notice Crea un nuevo match, acuñando un SBT para cada usuario.
     * @dev Llama al contrato MatchData para crear la entrada de datos correspondiente.
     * Solo puede ser llamado por el owner (backend).
     * @param _userA Dirección del primer usuario.
     * @param _userB Dirección del segundo usuario.
     * @param _locationHint Pista sobre la ubicación del match.
     */
    function createMatch(address _userA, address _userB, string memory _locationHint) public onlyOwner {
        require(address(matchDataContract) != address(0), "MatchData contract not set");
        require(!matchExists[_userA][_userB] && !matchExists[_userB][_userA], "El match ya existe");

        uint256 tokenIdA = _nextTokenId++;
        uint256 tokenIdB = _nextTokenId++;
        uint256 newMatchId = _nextMatchId++;

        tokenToMatchId[tokenIdA] = newMatchId;
        tokenToMatchId[tokenIdB] = newMatchId;
        matchExists[_userA][_userB] = true;

        _safeMint(_userA, tokenIdA);
        _safeMint(_userB, tokenIdB);

        matchDataContract.createMatchEntry(newMatchId, _userA, _userB, _locationHint);

        emit MatchCreated(newMatchId, tokenIdA, tokenIdB, _userA, _userB);
    }

    /**
     * @inheritdoc IProofOfMatch
     */
    function getTokensOfOwner(address owner) public view returns (uint256[] memory) {
        return _userTokens[owner];
    }

    // --- Soulbound Logic ---

    /**
     * @dev Sobrescrito para prevenir transferencias. Lanza un error siempre.
     */
    function transferFrom(address, address, uint256) public pure override {
        revert("Este es un Token Soulbound y no se puede transferir.");
    }

    /**
     * @dev Sobrescrito para prevenir transferencias. Lanza un error siempre.
     */
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Este es un Token Soulbound y no se puede transferir.");
    }

    // --- Internal Functions ---

    /**
     * @dev Sobrescrito de ERC721 para rastrear los tokens de cada dueño.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Lógica de OpenZeppelin (no tocar)
        super._update(to, tokenId, auth);

        // Nuestra lógica de rastreo
        if (from != address(0)) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }
        if (to != address(0)) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
        return from;
    }

    /**
     * @dev Añade un token al array de un dueño. Lógica interna para getTokensOfOwner.
     */
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        _tokenIndex[tokenId] = _userTokens[to].length;
        _userTokens[to].push(tokenId);
    }

    /**
     * @dev Elimina un token del array de un dueño de forma eficiente (swap-and-pop).
     */
    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 lastTokenIndex = _userTokens[from].length - 1;
        uint256 tokenIndex = _tokenIndex[tokenId];
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _userTokens[from][lastTokenIndex];
            _userTokens[from][tokenIndex] = lastTokenId;
            _tokenIndex[lastTokenId] = tokenIndex;
        }
        _userTokens[from].pop();
        delete _tokenIndex[tokenId];
    }
}
