// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EventLogger {
    event FlowCreated(bytes32 indexed flowId, bytes32 indexed companyId, string metadataURI, address creator);
    event FlowStep(bytes32 indexed flowId, bytes32 indexed anchorId, bytes32 dataHash, string note, address actor);
    event CrossChainAnchorReceived(bytes32 indexed anchorId, bytes32 indexed companyId, bytes32 flowId, uint32 srcEid);

    function emitFlowCreated(bytes32 flowId, bytes32 companyId, string calldata metadataURI) external {
        emit FlowCreated(flowId, companyId, metadataURI, msg.sender);
    }

    function emitFlowStep(bytes32 flowId, bytes32 anchorId, bytes32 dataHash, string calldata note) external {
        emit FlowStep(flowId, anchorId, dataHash, note, msg.sender);
    }

    function emitCrossChainAnchor(bytes32 anchorId, bytes32 companyId, bytes32 flowId, uint32 srcEid) external {
        emit CrossChainAnchorReceived(anchorId, companyId, flowId, srcEid);
    }
}
