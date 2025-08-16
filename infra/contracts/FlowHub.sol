// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./lz/ILayerZeroEndpointV2.sol";
import "./lz/ILayerZeroReceiverV2.sol";
import "./lz/LZTypes.sol";

contract FlowHub is ILayerZeroReceiverV2 {
    struct Company {
        address owner;
        bool hasOwnChain;
        uint32 dstEid;    // if hasOwnChain
        string metaURI;
        bool exists;
    }

    address public owner;
    ILayerZeroEndpointV2 public endpoint;
    uint32 public immutable FLOW_EID;

    mapping(uint256 => Company) public companies;
    mapping(uint32 => bytes32) public peers; // dstEid => bytes32(abi.encodePacked(address SpokeOApp))

    // replay / idempotency
    mapping(bytes32 => bool) public seenPayload;

    event CompanyRegistered(uint256 indexed companyId, address indexed owner, bool hasOwnChain, uint32 dstEid, string metaURI);
    event BlockMirrorInitiated(uint256 indexed companyId, bytes32 payloadHash, uint256 userId, uint256 workspaceId, uint32 dstEid, uint64 nonce);
    event MirrorAcked(uint256 indexed companyId, bytes32 payloadHash, uint32 dstEid, bool ok, bytes32 dstTxHash, uint64 nonce);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor(address _endpoint, uint32 _flowEid) {
        owner = msg.sender;
        endpoint = ILayerZeroEndpointV2(_endpoint);
        FLOW_EID = _flowEid;
    }

    function setPeer(uint32 eid, bytes32 peer) external onlyOwner {
        peers[eid] = peer;
    }

    function registerCompany(
        uint256 companyId,
        address companyOwner,
        bool hasOwnChain,
        uint32 dstEid,
        string calldata metaURI
    ) external onlyOwner {
        require(!companies[companyId].exists, "exists");
        companies[companyId] = Company({
            owner: companyOwner,
            hasOwnChain: hasOwnChain,
            dstEid: dstEid,
            metaURI: metaURI,
            exists: true
        });
        emit CompanyRegistered(companyId, companyOwner, hasOwnChain, dstEid, metaURI);
    }

    // If company has own chain, mirror-first (to Spoke), then we ack to reflect on Flow.
    // If not, Flow is primary (just emit an event here).
    function pushBlock(
        uint256 companyId,
        bytes32 payloadHash,
        uint256 userId,
        uint256 workspaceId,
        uint64 nonce,
        bytes calldata lzOptions  // executor options (gas, value caps)
    ) external payable {
        Company memory c = companies[companyId];
        require(c.exists, "company?");
        require(msg.sender == c.owner || msg.sender == owner, "not authorized");

        if (!c.hasOwnChain) {
            // Flow primary — nothing to send; you can emit an indexable event here too.
            emit MirrorAcked(companyId, payloadHash, FLOW_EID, true, bytes32(0), nonce);
            return;
        }

        bytes32 peer = peers[c.dstEid];
        require(peer != bytes32(0), "peer?");

        // payload: companyId | payloadHash | userId | workspaceId | nonce
        bytes memory message = abi.encode(companyId, payloadHash, userId, workspaceId, nonce);

        LZTypes.MessagingParams memory params = LZTypes.MessagingParams({
            dstEid: c.dstEid,
            receiver: peer,
            message: message,
            options: lzOptions,
            payInLzToken: address(0)
        });

        emit BlockMirrorInitiated(companyId, payloadHash, userId, workspaceId, c.dstEid, nonce);
        endpoint.send{value: msg.value}(params, msg.sender);
    }

    // Receiver for ACKs coming back from SpokeOApp
    function lzReceive(
        LZTypes.Origin calldata origin,
        bytes32 guid,
        bytes calldata message,
        address /*executor*/,
        bytes calldata /*extraData*/
    ) external override {
        require(msg.sender == address(endpoint), "not endpoint");
        require(peers[origin.srcEid] != bytes32(0), "unknown src");
        // decode ack: companyId, payloadHash, ok, dstTxHash, nonce
        (uint256 companyId, bytes32 payloadHash, bool ok, bytes32 dstTxHash, uint64 nonce) =
            abi.decode(message, (uint256, bytes32, bool, bytes32, uint64));

        // idempotency
        bytes32 key = keccak256(abi.encode(origin.srcEid, guid, companyId, payloadHash, nonce));
        if (seenPayload[key]) return;
        seenPayload[key] = true;

        emit MirrorAcked(companyId, payloadHash, origin.srcEid, ok, dstTxHash, nonce);
    }

    // rescue
    function withdraw(address payable to) external onlyOwner {
        to.transfer(address(this).balance);
    }
}
