// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OApp} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import {OptionsBuilder} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PartnerRelayLz
 * @notice Partner-side OApp that can send supply-chain digests to Flow EVM hub, and receive mirrors back.
 */
contract PartnerRelayLz is OApp, Ownable {
    using OptionsBuilder for bytes;

    event LzSent(uint32 indexed dstEid, address indexed hub, uint256 workspaceId, bytes32 root, string batchCid);
    event LzReceived(uint32 indexed srcEid, address indexed hub, uint256 workspaceId, bytes32 root, string batchCid);

    constructor(address _endpoint, address _owner) OApp(_endpoint, _owner) Ownable(_owner) {}

    function setPeer(uint32 eid, address peer) external onlyOwner {
        _setPeer(eid, _toBytes32(peer));
    }

    function getPeer(uint32 eid) external view returns (address) {
        bytes32 p = peers[eid];
        require(p != bytes32(0), "no peer");
        return _toAddress(p);
    }

    /// @notice Partner → Flow: send digest to hub
    function sendToFlow(
        uint32 flowEid,
        address flowHub,
        uint256 workspaceId,
        bytes32 root,
        string calldata batchCid
    ) external payable onlyOwner {
        if (peers[flowEid] == bytes32(0)) {
            _setPeer(flowEid, _toBytes32(flowHub));
        }
        bytes memory payload = abi.encode(workspaceId, root, batchCid);
        bytes memory options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(200000, 0, 0);

        _lzSend(flowEid, payload, options, _msgSender(), address(0));
        emit LzSent(flowEid, flowHub, workspaceId, root, batchCid);
    }

    /// @dev Flow → Partner mirror receive
    function _lzReceive(
        Origin calldata _origin,
        bytes32 /*_guid*/,
        bytes calldata _payload,
        address /*_executor*/,
        bytes calldata /*_extra*/
    ) internal override {
        (uint256 workspaceId, bytes32 root, string memory batchCid) = abi.decode(_payload, (uint256, bytes32, string));
        emit LzReceived(_origin.srcEid, _toAddress(_origin.sender), workspaceId, root, batchCid);
        // Optionally: write to a local registry here, or emit further app events for indexing.
    }

    function _toBytes32(address a) internal pure returns (bytes32) { return bytes32(uint256(uint160(a))); }
    function _toAddress(bytes32 b) internal pure returns (address) { return address(uint160(uint256(b))); }
}
