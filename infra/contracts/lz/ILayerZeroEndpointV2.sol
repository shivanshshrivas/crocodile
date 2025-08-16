// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "./LZTypes.sol";

interface ILayerZeroEndpointV2 {
    function send(
        LZTypes.MessagingParams calldata params,
        address refundAddress
    ) external payable returns (LZTypes.MessagingReceipt memory);

    function getSendLibrary(address oapp) external view returns (address);
}
