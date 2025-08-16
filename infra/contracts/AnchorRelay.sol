// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { OApp, MessagingFee, MessagingReceipt, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { OptionsBuilder } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

interface IAnchorRegistryWrite {
    function recordAnchor(bytes32 anchorId, bytes32 companyId, bytes32 dataHash, bytes32 flowId, uint32 chainEid) external;
}

contract AnchorRelay is OApp, Ownable {
    using OptionsBuilder for bytes;

    // destination writer
    IAnchorRegistryWrite public anchorRegistry;

    // srcEid => peer address (set in OApp)
    // peers mapping is managed by OApp's internal storage via setPeer

    event AnchorSent(bytes32 indexed guid, uint64 nonce, uint32 indexed dstEid, bytes32 anchorId, bytes32 companyId, bytes32 flowId, bytes32 dataHash);
    event AnchorReceived(uint32 indexed srcEid, bytes32 anchorId, bytes32 companyId, bytes32 flowId, bytes32 dataHash);

    constructor(address _endpoint, address _delegate, address _anchorRegistry)
        OApp(_endpoint, _delegate)
        Ownable(_delegate)
    {
        anchorRegistry = IAnchorRegistryWrite(_anchorRegistry);
    }

    /// Build the anchor message payload (ABI-encoded)
    function _buildMsg(
        bytes32 anchorId,
        bytes32 companyId,
        bytes32 flowId,
        bytes32 dataHash
    ) internal pure returns (bytes memory) {
        return abi.encode(anchorId, companyId, flowId, dataHash);
    }

    /// Public quote function — mirrors the exact message/options used in sendAnchor.
    function quoteAnchor(
        uint32 dstEid,
        bytes32 anchorId,
        bytes32 companyId,
        bytes32 flowId,
        bytes32 dataHash,
        bytes calldata options,
        bool payInLzToken
    ) external view returns (uint256 nativeFee, uint256 lzTokenFee) {
        bytes memory message = _buildMsg(anchorId, companyId, flowId, dataHash);
        // Combine caller-provided options with any enforced options configured on-chain.
        bytes memory combined = _combineOptions(dstEid, options); // wrapper for OApp's combine
        MessagingFee memory fee = _quote(dstEid, message, combined, payInLzToken);
        return (fee.nativeFee, fee.lzTokenFee);
    }

    /// Send anchor cross-chain. Caller must provide sufficient msg.value for native fees (or pay in ZRO).
    function sendAnchor(
        uint32 dstEid,
        bytes32 anchorId,
        bytes32 companyId,
        bytes32 flowId,
        bytes32 dataHash,
        bytes calldata options
    ) external payable returns (bytes32 guid, uint64 nonce, uint256 nativeFee) {
        bytes memory message = _buildMsg(anchorId, companyId, flowId, dataHash);
        bytes memory combined = _combineOptions(dstEid, options);
        MessagingFee memory fee = _quote(dstEid, message, combined, false /*payNative*/);
        MessagingReceipt memory receipt = _lzSend(dstEid, message, combined, fee, payable(msg.sender));
        emit AnchorSent(receipt.guid, receipt.nonce, dstEid, anchorId, companyId, flowId, dataHash);
        return (receipt.guid, receipt.nonce, fee.nativeFee);
    }

    /// INTERNAL: merge provided options with enforced options (OAppOptionsType3 or similar)
    function _combineOptions(uint32 dstEid, bytes memory options) internal view returns (bytes memory) {
        // If you extend OAppOptionsType3, call combineOptions(dstEid, SEND, options).
        // With vanilla OApp, pass options through (workers will handle).
        return options;
    }

    /// Handle inbound messages (only Endpoint can call; OApp enforces peer).
    function _lzReceive(
        Origin calldata _origin,
        bytes32 /*guid*/,
        bytes calldata _message,
        address /*executor*/,
        bytes calldata /*extraData*/
    ) internal override {
        (bytes32 anchorId, bytes32 companyId, bytes32 flowId, bytes32 dataHash) =
            abi.decode(_message, (bytes32, bytes32, bytes32, bytes32));

        // record on destination chain using the local registry
        anchorRegistry.recordAnchor(anchorId, companyId, dataHash, flowId, _origin.srcEid);
        emit AnchorReceived(_origin.srcEid, anchorId, companyId, flowId, dataHash);
    }
}
