// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {OApp, Origin, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {OAppOptionsType3} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CrocOApp is OApp, OAppOptionsType3, Ownable {
    event BlockSent(uint32 dstEid, bytes32 payloadHash);
    event BlockReceived(uint32 srcEid, bytes32 payloadHash, uint256 userId, uint256 workspaceId);

    uint16 public constant SEND = 1; // options “tag”

    // owner = deployer (no env needed)
    constructor(address _endpoint) OApp(_endpoint, msg.sender) Ownable(msg.sender) {}

    // --- wiring ---
    function setPeer(uint32 eid, bytes32 peer) external onlyOwner {
        _setPeer(eid, peer);
    }

    // set enforced gas on dst chain
    function setEnforcedGas(uint32 eid, uint128 gas) external onlyOwner {
        bytes memory opt = _optionsType3(eid, SEND, gas, 0, address(0));
        _setEnforcedOptions(eid, opt);
    }

    // --- send ---
    function sendBlock(
        uint32 _dstEid,
        bytes32 _payloadHash,
        uint256 _userId,
        uint256 _workspaceId,
        bytes calldata _options // extra options to merge
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

    // --- receive ---
    function _lzReceive(
        Origin calldata _origin,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        (bytes32 payloadHash, uint256 userId, uint256 workspaceId)
            = abi.decode(_message, (bytes32, uint256, uint256));
        emit BlockReceived(_origin.srcEid, payloadHash, userId, workspaceId);
    }
}
