// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title HubRegistry (Flow EVM): canonical log + Hyperlane receiver + off-chain mirror
contract HubRegistry {
    // --- config ---
    address public immutable mailbox; // Hyperlane Mailbox on Flow (for trustless path)
    address public admin;

    // --- storage ---
    struct LogData {
        address author;
        bytes32 contentHash;
        uint256 timestamp;
        string  metadata;
    }

    // canonical logs by user-supplied logId
    mapping(bytes32 => LogData) public logs;

    // Hyperlane dedupe: key = keccak256(originDomain, senderBytes32, logId)
    mapping(bytes32 => bool) public seen;

    // Off-chain mirror dedupe: key = keccak256(originDomain, logId)
    mapping(bytes32 => bool) private offchainSeen;

    // --- events ---
    event HubLogPushed(bytes32 indexed logId, address indexed author, bytes32 contentHash, string metadata);
    event ReceiptRecorded(uint32 indexed origin, address indexed sender, bytes32 indexed logId);
    event OffchainReceiptRecorded(uint32 indexed origin, bytes32 indexed logId, address author);

    // --- modifiers ---
    modifier onlyAdmin() { require(msg.sender == admin, "not admin"); _; }
    modifier onlyMailbox() { require(msg.sender == mailbox, "sender not mailbox"); _; }

    // --- init ---
    constructor(address _mailbox) {
        mailbox = _mailbox;
        admin = msg.sender;
    }

    function setAdmin(address _admin) external onlyAdmin {
        admin = _admin;
    }

    // --- direct writes on Flow (optional) ---
    function pushHubLog(bytes32 logId, bytes32 contentHash, string calldata metadata) external {
        logs[logId] = LogData({
            author: msg.sender,
            contentHash: contentHash,
            timestamp: block.timestamp,
            metadata: metadata
        });
        emit HubLogPushed(logId, msg.sender, contentHash, metadata);
    }

    // --- Hyperlane receive hook (trustless path) ---
    // message body = abi.encode(logId, contentHash, metadata, author)
    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _messageBody
    ) external onlyMailbox {
        (bytes32 logId, bytes32 contentHash, string memory metadata, address author) =
            abi.decode(_messageBody, (bytes32, bytes32, string, address));

        bytes32 key = keccak256(abi.encode(_origin, _sender, logId));
        require(!seen[key], "duplicate");
        seen[key] = true;

        logs[logId] = LogData({
            author: author,
            contentHash: contentHash,
            timestamp: block.timestamp,
            metadata: metadata
        });

        emit HubLogPushed(logId, author, contentHash, metadata);
        emit ReceiptRecorded(_origin, _bytes32ToAddress(_sender), logId);
    }

    // --- off-chain mirror helpers (trusted admin path) ---

    /// @notice Check if an off-chain receipt (origin, logId) has already been recorded.
    function hasOffchainReceipt(uint32 origin, bytes32 logId) external view returns (bool) {
        return offchainSeen[keccak256(abi.encode(origin, logId))];
    }

    /// @notice Admin-only mirror of a spoke write without bridge delivery.
    /// Mirrors the same shape as `handle(...)` and emits HubLogPushed + OffchainReceiptRecorded.
    function recordReceiptFromOffchain(
        uint32 origin,
        bytes32 logId,
        bytes32 contentHash,
        string calldata metadata,
        address author
    ) external onlyAdmin {
        bytes32 key = keccak256(abi.encode(origin, logId));
        require(!offchainSeen[key], "duplicate");
        offchainSeen[key] = true;

        logs[logId] = LogData({
            author: author,
            contentHash: contentHash,
            timestamp: block.timestamp,
            metadata: metadata
        });

        emit HubLogPushed(logId, author, contentHash, metadata);
        emit OffchainReceiptRecorded(origin, logId, author);
    }

    // --- utils ---
    function _bytes32ToAddress(bytes32 b) internal pure returns (address) {
        return address(uint160(uint256(b)));
    }
}
