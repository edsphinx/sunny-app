// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IMatchData } from "./IMatchData.sol";

/**
 * @title Match Data
 * @author edsphinx
 * @notice Contrato para almacenar y gestionar los datos dinámicos de los matches,
 * como el nivel y el número de interacciones.
 * @dev Separa la lógica de datos de la lógica de tokens (SBT) para mayor
 * seguridad y flexibilidad.
 */
contract MatchData is IMatchData {
    /**
     * @notice La dirección del contrato ProofOfMatch principal.
     */
    address public proofOfMatchContract;
    /**
     * @notice La dirección del dueño del protocolo (backend), autorizado para registrar interacciones.
     */
    address public owner;

    /**
     * @notice Mapeo de ID de match a sus datos detallados.
     */
    mapping(uint256 => Match) public matches;

    /**
     * @dev Modificador para restringir funciones solo al dueño del protocolo.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    /**
     * @dev Al desplegar, se establecen las direcciones inmutables del contrato de SBTs y del dueño.
     */
    constructor(address _proofOfMatchAddress, address _ownerAddress) {
        proofOfMatchContract = _proofOfMatchAddress;
        owner = _ownerAddress;
    }

    /**
     * @inheritdoc IMatchData
     * @dev La seguridad se garantiza requiriendo que `msg.sender` sea el contrato ProofOfMatch.
     */
    function createMatchEntry(
        uint256 _matchId,
        address _userA,
        address _userB,
        string memory _locationHint
    ) external override {
        // Solo el contrato ProofOfMatch puede llamar esta función
        require(msg.sender == proofOfMatchContract, "Only ProofOfMatch can create entries");

        matches[_matchId] = Match({
            userA: _userA,
            userB: _userB,
            timestamp: block.timestamp,
            locationHint: _locationHint,
            level: 1,
            interactionCount: 1
        });
    }

    /**
     * @inheritdoc IMatchData
     * @dev La seguridad se garantiza con el modificador onlyOwner.
     * La lógica de niveles puede ser ajustada aquí en futuras versiones.
     */
    function recordInteraction(uint256 _matchId) external override onlyOwner {
        Match storage matchToUpdate = matches[_matchId];
        require(matchToUpdate.timestamp != 0, "Match does not exist");

        matchToUpdate.interactionCount++;

        uint8 oldLevel = matchToUpdate.level;
        if (matchToUpdate.interactionCount >= 5) {
            matchToUpdate.level = 3;
        } else if (matchToUpdate.interactionCount >= 3) {
            matchToUpdate.level = 2;
        }

        if (oldLevel != matchToUpdate.level) {
            emit MatchUpgraded(_matchId, matchToUpdate.level);
        }
    }

    /**
     * @inheritdoc IMatchData
     */
    function getMatchDetails(uint256 _matchId) external view override returns (Match memory) {
        return matches[_matchId];
    }
}
