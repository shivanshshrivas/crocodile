// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

interface ICompanyRegistry {
    function isActive(bytes32 companyId) external view returns (bool);
}

interface IAnchorRegistry {
    function recordAnchor(bytes32 anchorId, bytes32 companyId, bytes32 dataHash, bytes32 flowId, uint32 chainEid) external;
}

interface IEventLogger {
    function emitFlowCreated(bytes32 flowId, bytes32 companyId, string calldata metadataURI) external;
    function emitFlowStep(bytes32 flowId, bytes32 anchorId, bytes32 dataHash, string calldata note) external;
}

interface IAnchorRelayOApp {
    function sendAnchor(
        uint32 dstEid,
        bytes32 anchorId,
        bytes32 companyId,
        bytes32 flowId,
        bytes32 dataHash,
        bytes calldata options
    ) external payable returns (bytes32 guid, uint64 nonce, uint256 nativeFee);
    function quoteAnchor(
        uint32 dstEid,
        bytes32 anchorId,
        bytes32 companyId,
        bytes32 flowId,
        bytes32 dataHash,
        bytes calldata options,
        bool payInLzToken
    ) external view returns (uint256 nativeFee, uint256 lzTokenFee);
}

contract FlowHub is AccessControl {
    bytes32 public constant FLOW_ADMIN_ROLE = keccak256("FLOW_ADMIN_ROLE");
    bytes32 public constant FLOW_WRITER_ROLE = keccak256("FLOW_WRITER_ROLE");

    struct Flow {
        bytes32 companyId;
        string metadataURI;
        bool exists;
    }

    mapping(bytes32 => Flow) public flows;

    ICompanyRegistry public companyRegistry;
    IAnchorRegistry  public anchorRegistry;
    IEventLogger     public eventLogger;
    IAnchorRelayOApp public anchorRelay;

    event FlowUpserted(bytes32 indexed flowId, bytes32 indexed companyId, string metadataURI);
    event AnchorAttached(bytes32 indexed flowId, bytes32 indexed anchorId, bytes32 dataHash);

    constructor(address _companyRegistry, address _anchorRegistry, address _eventLogger, address _anchorRelay, address initialAdmin) {
        companyRegistry = ICompanyRegistry(_companyRegistry);
        anchorRegistry  = IAnchorRegistry(_anchorRegistry);
        eventLogger     = IEventLogger(_eventLogger);
        anchorRelay     = IAnchorRelayOApp(_anchorRelay);

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(FLOW_ADMIN_ROLE, initialAdmin);
        _grantRole(FLOW_WRITER_ROLE, initialAdmin);
    }

    function upsertFlow(bytes32 flowId, bytes32 companyId, string calldata metadataURI)
        external
        onlyRole(FLOW_ADMIN_ROLE)
    {
        require(companyRegistry.isActive(companyId), "Company inactive");
        flows[flowId] = Flow({companyId: companyId, metadataURI: metadataURI, exists: true});
        emit FlowUpserted(flowId, companyId, metadataURI);
        eventLogger.emitFlowCreated(flowId, companyId, metadataURI);
    }

    /// Record an on-chain anchor and optionally broadcast cross-chain through the OApp relay.
    function attachAnchor(
        bytes32 flowId,
        bytes32 anchorId,
        bytes32 dataHash,
        uint32  chainEid,           // where this anchor originates (current chain's Endpoint ID)
        bool    broadcast,
        uint32  dstEid,
        bytes   calldata options    // LayerZero executor options (gas/value/order). See docs. 
    ) external payable onlyRole(FLOW_WRITER_ROLE) {
        Flow memory f = flows[flowId];
        require(f.exists, "No flow");
        anchorRegistry.recordAnchor(anchorId, f.companyId, dataHash, flowId, chainEid);
        emit AnchorAttached(flowId, anchorId, dataHash);
        eventLogger.emitFlowStep(flowId, anchorId, dataHash, "anchor-attached");

        if (broadcast) {
            (bytes32 guid, , uint256 nativeFee) = anchorRelay.sendAnchor{value: msg.value}(
                dstEid, anchorId, f.companyId, flowId, dataHash, options
            );
            require(msg.value >= nativeFee, "Insufficient msg.value for LZ fee");
            // guid is available if you want to track
        }
    }
}
