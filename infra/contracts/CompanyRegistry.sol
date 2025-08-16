// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CompanyRegistry is Ownable {
    struct Company {
        string name;
        address admin;
        bool exists;
    }

    uint256 public nextId = 1;
    mapping(uint256 => Company) public companies;

    event CompanyRegistered(uint256 indexed id, string name, address admin);

    constructor(address owner_) Ownable(owner_) {}

    function registerCompany(string calldata name, address admin) external onlyOwner returns (uint256) {
        uint256 id = nextId++;
        companies[id] = Company({ name: name, admin: admin, exists: true });
        emit CompanyRegistered(id, name, admin);
        return id;
    }

    function getCompany(uint256 id) external view returns (Company memory) {
        require(companies[id].exists, "not found");
        return companies[id];
    }
}
