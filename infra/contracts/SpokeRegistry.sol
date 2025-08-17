// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMailbox {
    function dispatch(uint32 destinationDomain, bytes32 recipient, bytes calldata messageBody)
        external
        payable
        returns (bytes32);
}

contract SpokeRegistry {
    address public admin;
    IMailbox public mailbox;
    uint32   public flowDomain;
    address  public hubRecipient; // HubRegistry on Flow

    struct SpokeLog {
        address author;
        bytes32 contentHash;
        uint256 timestamp;
        string  metadata;
    }

    mapping(bytes32 => SpokeLog) public logs;

    event SpokeLogPushed(bytes32 indexed logId, address indexed author, bytes32 contentHash, string metadata);
    event SpokeDispatched(bytes32 indexed logId, bytes32 messageId, uint32 flowDomain, address hubRecipient);

    modifier onlyAdmin() { require(msg.sender == admin, "not admin"); _; }

    constructor(address _mailbox, uint32 _flowDomain, address _hubRecipient) {
        admin = msg.sender;
        mailbox = IMailbox(_mailbox);
        flowDomain = _flowDomain;
        hubRecipient = _hubRecipient;
    }

    function setHyperlane(address _mailbox, uint32 _flowDomain, address _hubRecipient) external onlyAdmin {
        mailbox = IMailbox(_mailbox);
        flowDomain = _flowDomain;
        hubRecipient = _hubRecipient;
    }

    function pushSpokeLog(bytes32 logId, bytes32 contentHash, string calldata metadata) external payable {
        logs[logId] = SpokeLog({ author: msg.sender, contentHash: contentHash, timestamp: block.timestamp, metadata: metadata });
        emit SpokeLogPushed(logId, msg.sender, contentHash, metadata);

        bytes memory body = abi.encode(logId, contentHash, metadata, msg.sender);
        bytes32 hubRecipientBytes32 = bytes32(uint256(uint160(hubRecipient)));

        bytes32 messageId = mailbox.dispatch{ value: msg.value }(flowDomain, hubRecipientBytes32, body);
        emit SpokeDispatched(logId, messageId, flowDomain, hubRecipient);
    }
}
