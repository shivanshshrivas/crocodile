// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

contract CertificateNFT is ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    Counters.Counter private _id;
    string public baseURIOverride;

    constructor(address admin) ERC721("Supply Certificate", "CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
    }

    function setBaseURI(string calldata newBase) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURIOverride = newBase;
    }

    function mint(address to, string calldata tokenURI_) external onlyRole(ISSUER_ROLE) returns (uint256 tokenId) {
        _id.increment();
        tokenId = _id.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURIOverride;
    }
}
