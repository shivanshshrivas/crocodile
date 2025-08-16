// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library LZTypes {
    struct Origin {
        uint32 srcEid;
        bytes32 sender; // abi.encodePacked(address) from EVM chains
        uint64 nonce;
    }

    struct MessagingReceipt {
        bytes32 guid;
        uint64 nonce;
    }

    struct MessagingParams {
        uint32 dstEid;
        bytes32 receiver;
        bytes message;
        bytes options; // executor options (gas, value, etc.)
        address payInLzToken; // address(0) => native
    }
}
