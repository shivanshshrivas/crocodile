// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @notice Lightweight on-chain pointer to off-chain event data (IPFS CIDs),
 *         keyed by workspace/company id. FlowHubLz (owner) writes here if you want on-chain pointers.
 */
contract EventLogger is Ownable {
    struct Log {
        uint256 workspaceId;
        string  cid;       // ipfs://manifest or json CID
        uint256 timestamp;
    }

    Log[] public logs;

    event EventPinned(uint256 indexed idx, uint256 indexed workspaceId, string cid, uint256 timestamp);

    constructor(address owner_) Ownable(owner_) {}

    function pin(uint256 workspaceId, string calldata cid) external onlyOwner returns (uint256) {
        logs.push(Log({ workspaceId: workspaceId, cid: cid, timestamp: block.timestamp }));
        uint256 idx = logs.length - 1;
        emit EventPinned(idx, workspaceId, cid, block.timestamp);
        return idx;
    }

    function count() external view returns (uint256) { return logs.length; }
}
