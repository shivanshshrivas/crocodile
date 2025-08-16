// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title FlowHub (Flow EVM hub)
/// @notice MVP hub for message passing. Uses a trusted relayer now; swap to LayerZero later.
contract FlowHub {
    event Sent(
        uint256 indexed workspaceId,
        bytes32 indexed root,
        string batchCid,
        uint256 dstChainId,
        address dst
    );

    event Received(
        uint256 indexed workspaceId,
        bytes32 indexed root,
        string batchCid,
        uint256 sourceChainId,
        bytes32 sourceTx
    );

    address public relayer; // trusted off-chain agent or LZ UA (MVP)

    constructor(address _relayer) {
        relayer = _relayer;
    }

    function setRelayer(address r) external {
        require(msg.sender == relayer, "only current relayer");
        relayer = r;
    }

    /// @notice Flow -> Partner: emit an intent to send to a partner chain
    function sendToChain(
        uint256 workspaceId,
        bytes32 root,
        string calldata batchCid,
        uint256 dstChainId,
        address dst
    ) external {
        // In a real LZ impl: endpoint.send{value: ...}(dstChainId, payload, adapterParams)
        emit Sent(workspaceId, root, batchCid, dstChainId, dst);
    }

    /// @notice Partner -> Flow: record an incoming message (delivered by relayer/LZ)
    function receiveFromLZ(
        uint256 workspaceId,
        bytes32 root,
        string calldata batchCid,
        uint256 sourceChainId,
        bytes32 sourceTx
    ) external {
        require(msg.sender == relayer, "not relayer");
        emit Received(workspaceId, root, batchCid, sourceChainId, sourceTx);
    }
}
