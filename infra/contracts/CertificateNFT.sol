// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateNFT is ERC721, Ownable {
    uint256 public nextId = 1;
    mapping(uint256 => string) private _tokenURIs;

    constructor(address initialOwner) ERC721("InterChain Certificate", "ICC") Ownable(initialOwner) {}

    function mint(address to, string memory tokenURI_) external onlyOwner returns (uint256) {
        uint256 id = nextId++;
        _safeMint(to, id);
        _tokenURIs[id] = tokenURI_;
        return id;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "nonexistent token");
        return _tokenURIs[tokenId];
    }
}
