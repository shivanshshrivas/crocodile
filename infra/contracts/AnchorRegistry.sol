// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AnchorRegistry {
    event Anchored(
        uint256 indexed workspaceId,
        bytes32 indexed root,
        string batchCid,
        address indexed submitter,
        uint256 batchNo,
        uint256 timestamp
    );

    mapping(uint256 => bytes32) public latestRootByWorkspace;

    function anchor(
        uint256 workspaceId,
        bytes32 root,
        string calldata batchCid,
        uint256 batchNo
    ) external {
        latestRootByWorkspace[workspaceId] = root;
        emit Anchored(workspaceId, root, batchCid, msg.sender, batchNo, block.timestamp);
    }
}
