// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuditLog {
    event ChangeLogged(string eventType, string resourceId, string user, string details, uint256 timestamp);

    function logChange(string memory eventType, string memory resourceId, string memory user, string memory details) public {
        emit ChangeLogged(eventType, resourceId, user, details, block.timestamp);
    }
}