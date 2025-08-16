// contracts/CrocOApp.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {OApp, Origin, MessagingFee} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import {OAppOptionsType3} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";
import {OptionsBuilder} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import {EnforcedOptionParam} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppOptionsType3.sol";

contract CrocOApp is OApp, OAppOptionsType3 {
    event BlockSent(uint32 dstEid, bytes32 payloadHash);
    event BlockReceived(uint32 srcEid, bytes32 payloadHash, uint256 userId, uint256 workspaceId);

    uint16 public constant SEND = 1;

    // Owner is the deployer; OApp (which inherits Ownable) takes the owner address
    constructor(address _endpoint) OApp(_endpoint, msg.sender) {}

    // ---- wiring (owner-only) ----
    // inherits setPeer(uint32, bytes32) from OAppCore

    function setEnforcedGas(uint32 eid, uint128 gas) external onlyOwner {
        // Build type-3 options that enforce lzReceive gas on destination
        bytes memory opt = OptionsBuilder.newOptions();
        opt = OptionsBuilder.addExecutorLzReceiveOption(opt, gas, 0);

        EnforcedOptionParam[] memory params = new EnforcedOptionParam[](1);
        params[0] = EnforcedOptionParam({eid: eid, msgType: SEND, options: opt});
        _setEnforcedOptions(params);
    }

    // ---- send ----
    function sendBlock(
        uint32 _dstEid,
        bytes32 _payloadHash,
        uint256 _userId,
        uint256 _workspaceId,
        bytes calldata _options
    ) external payable {
        bytes memory _message = abi.encode(_payloadHash, _userId, _workspaceId);
        _lzSend(
            _dstEid,
            _message,
            combineOptions(_dstEid, SEND, _options),
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
        emit BlockSent(_dstEid, _payloadHash);
    }

    // convenience quote
    function quoteSendBlock(
        uint32 _dstEid,
        bytes32 _payloadHash,
        uint256 _userId,
        uint256 _workspaceId,
        bytes calldata _options,
        bool _payInZRO
    ) external view returns (MessagingFee memory fee) {
        bytes memory _message = abi.encode(_payloadHash, _userId, _workspaceId);
        fee = _quote(_dstEid, _message, combineOptions(_dstEid, SEND, _options), _payInZRO);
    }

    // ---- receive ----
    function _lzReceive(
        Origin calldata _origin,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        (bytes32 payloadHash, uint256 userId, uint256 workspaceId) =
            abi.decode(_message, (bytes32, uint256, uint256));
        emit BlockReceived(_origin.srcEid, payloadHash, userId, workspaceId);
    }
}
