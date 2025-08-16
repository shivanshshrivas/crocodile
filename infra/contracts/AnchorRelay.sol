// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title AnchorRelay (partner chain side)
/// @notice Receives from FlowHub or sends to FlowHub. MVP uses a trusted relayer.
contract AnchorRelay {
    event Sent(
        uint256 indexed workspaceId,
        bytes32 indexed root,
        string batchCid,
        address flowHub
    );

    event Mirrored(
        uint256 indexed workspaceId,
        bytes32 indexed root,
        string batchCid,
        uint256 fromChainId
    );

    address public flowHub; // Flow EVM hub address
    address public relayer; // trusted off-chain agent / LZ UA for MVP

    constructor(address _flowHub, address _relayer) {
        flowHub = _flowHub;
        relayer = _relayer;
    }

    /// @notice Partner -> Flow (originating on partner chain)
    function sendToFlow(
        uint256 workspaceId,
        bytes32 root,
        string calldata batchCid
    ) external {
        // In a real LZ impl: endpoint.send to FlowHub on Flow EVM
        emit Sent(workspaceId, root, batchCid, flowHub);
    }

    /// @notice Flow -> Partner (mirror from Flow)
    function receiveFromFlow(
        uint256 workspaceId,
        bytes32 root,
        string calldata batchCid,
        uint256 flowChainId
    ) external {
        require(msg.sender == relayer, "not relayer");
        emit Mirrored(workspaceId, root, batchCid, flowChainId);
    }
}
