// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "./LZTypes.sol";

interface ILayerZeroReceiverV2 {
    function lzReceive(
        LZTypes.Origin calldata origin,
        bytes32 guid,
        bytes calldata message,
        address executor,
        bytes calldata extraData
    ) external;
}
