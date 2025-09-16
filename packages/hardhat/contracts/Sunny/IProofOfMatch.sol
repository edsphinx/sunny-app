// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IProofOfMatch Interface
 * @author edsphinx
 * @dev Define la interfaz pública para el contrato ProofOfMatch.
 * Establece las funciones y eventos necesarios para la interacción
 * con otros contratos como PresenceScore.
 */
interface IProofOfMatch {
    /**
     * @notice Se emite cuando se crea un nuevo match y se acuñan los dos SBTs.
     * @param matchId El ID único para la relación/match.
     * @param tokenIdA El ID del token acuñado para el usuario A.
     * @param tokenIdB El ID del token acuñado para el usuario B.
     * @param userA La dirección del usuario A.
     * @param userB La dirección del usuario B.
     */
    event MatchCreated(uint256 indexed matchId, uint256 tokenIdA, uint256 tokenIdB, address userA, address userB);

    /**
     * @notice Devuelve el ID del match asociado a un token específico.
     * @param tokenId El ID del token a consultar.
     * @return El ID único del match.
     */
    function tokenToMatchId(uint256 tokenId) external view returns (uint256);

    /**
     * @notice Devuelve un array con todos los IDs de los tokens que posee un usuario.
     * @param owner La dirección del usuario.
     * @return Un array de token IDs.
     */
    function getTokensOfOwner(address owner) external view returns (uint256[] memory);
}
