// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OApp} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import {OptionsBuilder} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FlowHubLz
 * @notice Flow EVM hub for your app. Receives partner-originated messages (via LZ)
 *         and can fan out Flow-originated updates to partner chains.
 * @dev    Stores no heavy state (you’ll index events off-chain and/or write to Flow Cadence).
 */
contract FlowHubLz is OApp, Ownable {
    using OptionsBuilder for bytes;

    // ========== Events ==========
    event LzSent(uint32 indexed dstEid, address indexed peer, uint256 workspaceId, bytes32 root, string batchCid);
    event LzReceived(uint32 indexed srcEid, address indexed peer, uint256 workspaceId, bytes32 root, string batchCid);

    // optional lightweight state (latest root per workspace)
    mapping(uint256 => bytes32) public latestRootByWorkspace;

    constructor(address _endpoint, address _owner) OApp(_endpoint, _owner) Ownable(_owner) {}

    // -------- Admin wiring --------

    /// @notice Set a trusted remote peer for a LayerZero endpoint ID (eid)
    function setPeer(uint32 eid, address peer) external onlyOwner {
        _setPeer(eid, _toBytes32(peer));
    }

    /// @notice Helper to check currently set peer (decoded)
    function getPeer(uint32 eid) external view returns (address) {
        bytes32 p = peers[eid];
        require(p != bytes32(0), "no peer");
        return _toAddress(p);
    }

    // -------- Flow -> Partner --------

    /**
     * @notice Send a payload to a partner chain via LZ.
     * @param dstEid      LayerZero endpoint ID of destination chain
     * @param dstPeer     The partner app address on destination
     * @param workspaceId Workspace / company id
     * @param root        Merkle root for the batch
     * @param batchCid    IPFS CID string (manifest.json)
     *
     * @dev options: tune gas limit; fee: msg.value pays native fee
     */
    function sendToChain(
        uint32 dstEid,
        address dstPeer,
        uint256 workspaceId,
        bytes32 root,
        string calldata batchCid
    ) external payable onlyOwner {
        if (peers[dstEid] == bytes32(0)) {
            _setPeer(dstEid, _toBytes32(dstPeer));
        }
        bytes memory payload = abi.encode(workspaceId, root, batchCid);
        bytes memory options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(200000, 0, 0);

        // msg.value funds native fee; no ZRO token fee
        _lzSend(dstEid, payload, options, _msgSender(), address(0));

        emit LzSent(dstEid, dstPeer, workspaceId, root, batchCid);
    }

    // -------- Partner -> Flow (LZ receive) --------

    /**
     * @dev LZ calls this on successful delivery.
     * Origin.peer is the source app contract (address packed in bytes32).
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 /* _guid */,
        bytes calldata _payload,
        address /* _executor */,
        bytes calldata /* _extraData */
    ) internal override {
        (uint256 workspaceId, bytes32 root, string memory batchCid) = abi.decode(_payload, (uint256, bytes32, string));
        latestRootByWorkspace[workspaceId] = root;

        emit LzReceived(_origin.srcEid, _toAddress(_origin.sender), workspaceId, root, batchCid);
        // NOTE: Your off-chain worker listens to LzReceived, fetches `batchCid` from IPFS,
        // runs AI checks, and writes into Flow Cadence (FlowAnchor.cdc).
    }

    // -------- Helpers --------
    function _toBytes32(address a) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(a)));
    }
    function _toAddress(bytes32 b) internal pure returns (address) {
        return address(uint160(uint256(b)));
    }
}
