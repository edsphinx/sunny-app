// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IMatchData } from "./IMatchData.sol";
import { IProofOfMatch } from "./IProofOfMatch.sol"; // Importamos el contrato, no una interfaz

/**
 * @title Presence Protocol Score
 * @author edsphinx
 * @notice Contrato de solo lectura que calcula una "Puntuación de Presencia"
 * para un usuario, sirviendo como un mecanismo de resistencia a Sybil.
 * @dev Lee datos de los contratos ProofOfMatch y MatchData para generar una
 * puntuación de reputación social on-chain.
 */
contract PresenceScore {
    /**
     * @notice La instancia del contrato IProofOfMatch.
     */
    IProofOfMatch public proofOfMatchContract;
    /**
     * @notice La instancia del contrato IMatchData.
     */
    IMatchData public matchDataContract;

    /**
     * @dev Al desplegar, se enlazan las direcciones de los contratos de los que depende.
     */
    constructor(address _proofOfMatchAddress, address _matchDataAddress) {
        proofOfMatchContract = IProofOfMatch(_proofOfMatchAddress);
        matchDataContract = IMatchData(_matchDataAddress);
    }

    /**
     * @notice Calcula la Puntuación de Presencia para una dirección de usuario.
     * @dev Lee los tokens del usuario, obtiene los datos de cada match asociado
     * y aplica una fórmula para generar una puntuación.
     * @param user La dirección de la wallet a consultar.
     * @return score La Puntuación de Presencia calculada.
     */
    function getPresenceScore(address user) public view returns (uint256) {
        uint256 score = 0;

        // 1. Obtenemos todos los tokens (SBTs) que posee el usuario
        uint256[] memory tokens = proofOfMatchContract.getTokensOfOwner(user);

        for (uint i = 0; i < tokens.length; i++) {
            // 2. Por cada token, obtenemos el ID del match al que pertenece
            uint256 matchId = proofOfMatchContract.tokenToMatchId(tokens[i]);

            // 3. Obtenemos los detalles de ese match (incluyendo el nivel)
            IMatchData.Match memory currentMatch = matchDataContract.getMatchDetails(matchId);

            // 4. Aplicamos la fórmula de puntuación
            if (currentMatch.level == 1) {
                score += 10;
            } else if (currentMatch.level == 2) {
                score += 25;
            } else if (currentMatch.level >= 3) {
                score += 50;
            }
        }

        return score;
    }
}
