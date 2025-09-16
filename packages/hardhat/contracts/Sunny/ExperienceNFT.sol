// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Experience NFT
 * @author edsphinx
 * @dev Contrato para que un negocio tokenice sus servicios como vouchers NFT.
 * El dueño del contrato (el negocio) es el único que puede acuñar nuevos NFTs.
 */
contract ExperienceNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    // Añadimos nuestro propio mapping para las URIs
    mapping(uint256 => string) private _tokenURIs;

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {}

    /**
     * @dev Devuelve la URI para un token específico.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // Asegura que el token exista
        return _tokenURIs[tokenId];
    }

    /**
     * @notice Acuña un nuevo NFT de experiencia para un comprador.
     * @param to La dirección que recibirá el NFT (el comprador).
     * @param _tokenURI La URI de los metadatos que describen la experiencia.
     */
    function mintExperience(address to, string memory _tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = _tokenURI;
        return tokenId;
    }
}
