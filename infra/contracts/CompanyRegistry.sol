// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract CompanyRegistry is AccessControl {
    bytes32 public constant COMPANY_ADMIN_ROLE = keccak256("COMPANY_ADMIN_ROLE");

    struct Company {
        address admin;
        string metadataURI;   // e.g., IPFS JSON with legal name, docs
        bool active;
    }

    mapping(bytes32 => Company) private companies; // companyId => Company

    event CompanyRegistered(bytes32 indexed companyId, address indexed admin, string metadataURI);
    event CompanyUpdated(bytes32 indexed companyId, string metadataURI, bool active);

    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(COMPANY_ADMIN_ROLE, initialAdmin);
    }

    function registerCompany(bytes32 companyId, address admin, string calldata metadataURI, bool active)
        external
        onlyRole(COMPANY_ADMIN_ROLE)
    {
        require(companies[companyId].admin == address(0), "Company exists");
        companies[companyId] = Company({admin: admin, metadataURI: metadataURI, active: active});
        emit CompanyRegistered(companyId, admin, metadataURI);
    }

    function updateCompany(bytes32 companyId, string calldata metadataURI, bool active)
        external
    {
        Company storage c = companies[companyId];
        require(c.admin != address(0), "No company");
        require(msg.sender == c.admin || hasRole(COMPANY_ADMIN_ROLE, msg.sender), "Not authorized");
        c.metadataURI = metadataURI;
        c.active = active;
        emit CompanyUpdated(companyId, metadataURI, active);
    }

    function getCompany(bytes32 companyId) external view returns (Company memory) {
        return companies[companyId];
    }

    function isActive(bytes32 companyId) external view returns (bool) {
        return companies[companyId].active;
    }

    function companyAdmin(bytes32 companyId) external view returns (address) {
        return companies[companyId].admin;
    }
}
