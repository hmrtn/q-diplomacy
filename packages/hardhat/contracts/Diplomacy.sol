//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0; 

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

contract Diplomacy {

    using SafeMath for uint;

    struct Election {
        string name; 
        address[] candidates;
        mapping (address => uint) score; 
        mapping (address => bool) voted;
    }

    mapping (uint => Election) elections; 

    uint numElections;

    event ElectionCreated(address _creator, uint _electionId);
    
    function newElection(
        string memory _name, 
        address[] memory _candidates
    ) public returns (uint electionId) {
        
        electionId = numElections++; 
        Election storage election = elections[electionId];
        election.name = _name; 
        election.candidates = _candidates; 

        emit ElectionCreated(msg.sender, electionId);

    }

}
