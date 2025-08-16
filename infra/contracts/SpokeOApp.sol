// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./lz/ILayerZeroEndpointV2.sol";
import "./lz/ILayerZeroReceiverV2.sol";
import "./lz/LZTypes.sol";

/**
 * @title SpokeOApp
 * @notice Receives mirror requests from FlowHub (on Flow EVM), emits an indexable event,
 *         and ACKs back to FlowHub via LayerZero v2.
 *
 * Design notes:
 * - We allowlist a single Hub per srcEid (Flow EVM testnet in your setup).
 * - We use an idempotency map keyed by (srcEid, guid, companyId, payloadHash, nonce).
 * - For the ACK, we send the message's `guid` back in the `dstTxHash` field (on-chain code cannot read its own tx hash).
 * - `ackFeeWei` lets you provision native to fund the ACK send; fund the Spoke with native and set this value.
 */
contract SpokeOApp is ILayerZeroReceiverV2 {
    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    address public owner;
    ILayerZeroEndpointV2 public endpoint;
    uint32 public immutable LOCAL_EID;

    // Allowlisted hub per srcEid (packed EVM address as bytes32)
    mapping(uint32 => bytes32) public hubs; // srcEid => hub

    // Idempotency guard for processed payloads
    mapping(bytes32 => bool) public seenPayload;

    // Native fee to attach when sending the ACK back to the hub
    uint256 public ackFeeWei;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event BlockMirrored(
        uint256 indexed companyId,
        bytes32 payloadHash,
        uint32 srcEid,
        bytes32 dstTxHashLike, // we use LZ guid here
        uint64 nonce
    );

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(address _endpoint, uint32 _eid) {
        owner = msg.sender;
        endpoint = ILayerZeroEndpointV2(_endpoint);
        LOCAL_EID = _eid;
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    /// @notice Set the allowlisted hub for a given srcEid
    function setHub(uint32 srcEid, bytes32 hub) external onlyOwner {
        hubs[srcEid] = hub;
    }

    /// @notice Configure the native fee used for ACK sends
    function setAckFeeWei(uint256 v) external onlyOwner {
        ackFeeWei = v;
    }

    /// @notice Allow funding the contract with native (for ACK fees)
    receive() external payable {}

    /// @notice Withdraw any native stuck in the contract
    function withdraw(address payable to) external onlyOwner {
        to.transfer(address(this).balance);
    }

    // ---------------------------------------------------------------------
    // LayerZero receive
    // ---------------------------------------------------------------------

    /// @dev Receive mirror request from FlowHub
    function lzReceive(
        LZTypes.Origin calldata origin,
        bytes32 guid,
        bytes calldata message,
        address /*executor*/,
        bytes calldata /*extraData*/
    ) external override {
        require(msg.sender == address(endpoint), "not endpoint");

        uint32 srcEid = origin.srcEid;
        bytes32 hub = hubs[srcEid];
        require(hub != bytes32(0), "unknown src");
        // enforce that the sender matches the allowlisted hub
        require(origin.sender == hub, "bad sender");

        // decode: companyId, payloadHash, userId, workspaceId, nonce
        (uint256 companyId, bytes32 payloadHash, , , uint64 nonce) =
            abi.decode(message, (uint256, bytes32, uint256, uint256, uint64));

        // idempotency key across (srcEid, guid, companyId, payloadHash, nonce)
        bytes32 key = keccak256(abi.encode(srcEid, guid, companyId, payloadHash, nonce));
        if (seenPayload[key]) {
            // already processed; drop
            return;
        }
        seenPayload[key] = true;

        // Emit indexable event on destination chain.
        // We can't read our own tx hash on-chain, so use the LZ `guid` as a stable, unique id.
        emit BlockMirrored(companyId, payloadHash, srcEid, guid, nonce);

        // Prepare ACK back to the hub on Flow EVM:
        // We return (companyId, payloadHash, ok=true, dstTxHashLike=guid, nonce)
        bytes memory ack = abi.encode(companyId, payloadHash, true, guid, nonce);

        LZTypes.MessagingParams memory params = LZTypes.MessagingParams({
            dstEid: srcEid,
            receiver: hub,
            message: ack,
            options: bytes(""),          // can add executor gas options later if desired
            payInLzToken: address(0)     // pay in native
        });

        // Send ACK (attach configured native to cover LZ executor fees)
        endpoint.send{value: ackFeeWei}(params, address(0));
    }
}
