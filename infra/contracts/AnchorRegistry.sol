// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

interface ICompanyRegistryLike {
    function isActive(bytes32 companyId) external view returns (bool);
    function companyAdmin(bytes32 companyId) external view returns (address);
}

contract AnchorRegistry is AccessControl {
    bytes32 public constant ANCHOR_WRITER_ROLE = keccak256("ANCHOR_WRITER_ROLE");

    struct Anchor {
        bytes32 companyId;
        bytes32 dataHash;    // keccak256 of normalized payload (off-chain doc, batch manifest, etc.)
        bytes32 flowId;      // optional: link to a flow in FlowHub
        uint32  chainEid;    // LayerZero Endpoint ID for the chain where it originated (optional)
        uint64  timestamp;   // block timestamp at record
        address writer;      // who recorded this anchor
    }

    // anchorId can be deterministic (e.g., keccak(companyId, hash, flowId)) or externally provided
    mapping(bytes32 => Anchor) public anchors;

    ICompanyRegistryLike public companyRegistry;

    event AnchorRecorded(bytes32 indexed anchorId, bytes32 indexed companyId, bytes32 dataHash, bytes32 flowId, uint32 chainEid, address writer);

    constructor(address _companyRegistry, address initialAdmin) {
        companyRegistry = ICompanyRegistryLike(_companyRegistry);
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ANCHOR_WRITER_ROLE, initialAdmin);
    }

    function recordAnchor(
        bytes32 anchorId,
        bytes32 companyId,
        bytes32 dataHash,
        bytes32 flowId,
        uint32  chainEid
    ) external onlyRole(ANCHOR_WRITER_ROLE) {
        require(anchors[anchorId].timestamp == 0, "Anchor exists");
        require(companyRegistry.isActive(companyId), "Company inactive");
        anchors[anchorId] = Anchor({
            companyId: companyId,
            dataHash: dataHash,
            flowId: flowId,
            chainEid: chainEid,
            timestamp: uint64(block.timestamp),
            writer: msg.sender
        });
        emit AnchorRecorded(anchorId, companyId, dataHash, flowId, chainEid, msg.sender);
    }
}
