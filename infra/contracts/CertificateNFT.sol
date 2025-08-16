// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateNFT is ERC721, Ownable {
    uint256 public nextId;
    mapping(uint256 => string) private _uris;

    constructor(address owner_) ERC721("InterChain Certificate", "ICC") Ownable(owner_) {}

    function mint(address to, string calldata tokenURI_) external onlyOwner returns (uint256) {
        uint256 id = nextId++;
        _safeMint(to, id);
        _uris[id] = tokenURI_;
        return id;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "no token");
        return _uris[tokenId];
    }
}
