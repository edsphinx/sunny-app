// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IMatchData Interface
 * @author edsphinx
 * @dev Define la interfaz para el contrato que almacena y gestiona los datos
 * de los matches, como niveles e interacciones.
 */
interface IMatchData {
    /**
     * @dev Estructura que almacena toda la información de un match.
     */
    struct Match {
        address userA;
        address userB;
        uint256 timestamp;
        string locationHint;
        uint8 level;
        uint16 interactionCount;
    }

    /**
     * @notice Se emite cuando un match sube de nivel tras una nueva interacción.
     * @param matchId El ID del match que fue actualizado.
     * @param newLevel El nuevo nivel alcanzado.
     */
    event MatchUpgraded(uint256 indexed matchId, uint8 newLevel);

    /**
     * @notice Crea la entrada de datos inicial para un nuevo match.
     * @dev Debe ser llamado únicamente por el contrato ProofOfMatch.
     * @param _matchId El ID único del match a crear.
     * @param _userA La dirección del usuario A.
     * @param _userB La dirección del usuario B.
     * @param _locationHint Una pista no sensible sobre la ubicación del match.
     */
    function createMatchEntry(uint256 _matchId, address _userA, address _userB, string memory _locationHint) external;

    /**
     * @notice Registra una nueva interacción para un match existente, potencialmente subiéndolo de nivel.
     * @dev Debe ser llamado únicamente por el dueño del protocolo (backend).
     * @param _matchId El ID del match a actualizar.
     */
    function recordInteraction(uint256 _matchId) external;

    /**
     * @notice Obtiene todos los detalles de un match específico.
     * @param _matchId El ID del match a consultar.
     * @return La estructura completa del Match con todos sus datos.
     */
    function getMatchDetails(uint256 _matchId) external view returns (Match memory);
}
