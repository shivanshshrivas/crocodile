// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title SpokeRegistry (Sepolia / Polygon Amoy): local writes + (later) dispatch to Hub
contract SpokeRegistry {
    struct SpokeLog {
        address author;
        bytes32 contentHash;
        uint256 timestamp;
        string  metadata;
    }

    mapping(bytes32 => SpokeLog) public logs;

    event SpokeLogPushed(bytes32 indexed logId, address indexed author, bytes32 contentHash, string metadata);

    function pushSpokeLog(bytes32 logId, bytes32 contentHash, string calldata metadata) external {
        logs[logId] = SpokeLog({
            author: msg.sender,
            contentHash: contentHash,
            timestamp: block.timestamp,
            metadata: metadata
        });
        emit SpokeLogPushed(logId, msg.sender, contentHash, metadata);
        // NEXT: add Hyperlane Mailbox.dispatch(...) to notify Hub on Flow
    }
}
