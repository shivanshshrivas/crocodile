// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./lz/ILayerZeroEndpointV2.sol";
import "./lz/ILayerZeroReceiverV2.sol";
import "./lz/LZTypes.sol";

contract SpokeOApp is ILayerZeroReceiverV2 {
    address public owner;
    ILayerZeroEndpointV2 public endpoint;
    uint32 public immutable LOCAL_EID;

    // allowlisted hub per srcEid
    mapping(uint32 => bytes32) public hubs; // srcEid => hub (bytes32 packed address)
    mapping(bytes32 => bool) public seenPayload;

    event BlockMirrored(uint256 indexed companyId, bytes32 payloadHash, uint32 srcEid, bytes32 dstTxHash, uint64 nonce);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor(address _endpoint, uint32 _eid) {
        owner = msg.sender;
        endpoint = ILayerZeroEndpointV2(_endpoint);
        LOCAL_EID = _eid;
    }

    function setHub(uint32 srcEid, bytes32 hub) external onlyOwner {
        hubs[srcEid] = hub;
    }

    // Receive mirror request from FlowHub
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
    // enforce that sender matches allowlisted hub
    require(origin.sender == hub, "bad sender");

        // decode: companyId, payloadHash, userId, workspaceId, nonce
        (uint256 companyId, bytes32 payloadHash, , , uint64 nonce) =
            abi.decode(message, (uint256, bytes32, uint256, uint256, uint64));

    bytes32 key = keccak256(abi.encode(srcEid, guid, companyId, payloadHash, nonce));
        if (seenPayload[key]) {
            // already processed, just drop (idempotent)
            return;
        }
        seenPayload[key] = true;

        // Persist minimally (event-first for analytics; storage optional)
        // You could also map (companyId => latest payloadHash) if desired.
        bytes32 dstTxHash = bytes32(uint256(uint160(address(this)))) ^ keccak256(abi.encode(block.number, companyId, payloadHash));
    emit BlockMirrored(companyId, payloadHash, srcEid, dstTxHash, nonce);

        // ACK back to FlowHub
        bytes memory ack = abi.encode(companyId, payloadHash, true, dstTxHash, nonce);
        LZTypes.MessagingParams memory params = LZTypes.MessagingParams({
            dstEid: srcEid,
            receiver: hub,
            message: ack,
            options: bytes(""), // can set executor gas if needed
            payInLzToken: address(0)
        });
        endpoint.send(params, address(0));
    }

    function withdraw(address payable to) external onlyOwner {
        to.transfer(address(this).balance);
    }
}
