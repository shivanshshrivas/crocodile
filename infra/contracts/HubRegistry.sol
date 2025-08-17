// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title HubRegistry (Flow EVM): canonical log + cross-chain receipts
contract HubRegistry {
    struct LogData {
        address author;
        bytes32 contentHash;   // hash/pointer to your data payload (e.g., IPFS, Arweave)
        uint256 timestamp;
        string  metadata;      // lightweight string metadata
    }

    /// @dev originKey = keccak256(abi.encode(originChainId, originTxHash))
    mapping(bytes32 => bool) public receiptSeen;

    /// @dev hub logs keyed by a user-supplied or off-chain generated ID
    mapping(bytes32 => LogData) public logs;

    event HubLogPushed(bytes32 indexed logId, address indexed author, bytes32 contentHash, string metadata);
    event ReceiptRecorded(uint256 indexed originChainId, bytes32 indexed originTxHash);

    function pushHubLog(bytes32 logId, bytes32 contentHash, string calldata metadata) external {
        logs[logId] = LogData({
            author: msg.sender,
            contentHash: contentHash,
            timestamp: block.timestamp,
            metadata: metadata
        });
        emit HubLogPushed(logId, msg.sender, contentHash, metadata);
    }

    /// @notice Called when a spoke reports it pushed a block/log on its chain.
    /// @dev For now trustless only by convention; we’ll gate via Hyperlane ISM in the next step.
    function recordReceipt(uint256 originChainId, bytes32 originTxHash) external {
        bytes32 key = keccak256(abi.encode(originChainId, originTxHash));
        require(!receiptSeen[key], "duplicate");
        receiptSeen[key] = true;
        emit ReceiptRecorded(originChainId, originTxHash);
    }
}
