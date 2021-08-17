//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0; 

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

contract Diplomacy {

    using SafeMath for uint;

    struct Ballot {
        uint castAt;
    }

    struct Election {
        string name; 
        bool active;
        address[] candidates;
        mapping (address => uint) score;
        mapping (address => uint) result; 
        mapping (address => bool) voted;
        mapping (address => Ballot) ballot;
    }

    mapping (uint => Election) elections; 

    uint numElections;

    event ElectionCreated(address _creator, uint _electionId);
    event BallotCast(address _caster);
    event ElectionEnded(uint _electionId);
    
    function newElection(
        string memory _name, 
        address[] memory _candidates
    ) public payable returns (uint electionId) {
        
        electionId = numElections.add(1); 
        Election storage election = elections[electionId];
        election.name = _name; 
        election.candidates = _candidates; 
        election.active = true;

        emit ElectionCreated(msg.sender, electionId);

    }

    function endElection(uint electionId) public {

        Election storage election = elections[electionId];
        election.active = false; 

        for ( uint i = 0; i < election.candidates.length; i++ ) {
            address candidate = election.candidates[i];
            election.result[candidate] = election.result[candidate] * election.result[candidate];
        }
        
        _payout(electionId);

        emit ElectionEnded(electionId);

    }

    function castBallot(
        uint electionId,
        address[] memory _adrs, 
        uint[] memory _votes
    ) public { 

        Election storage election = elections[electionId];
        
        election.ballot[msg.sender] = Ballot({
            castAt: block.timestamp
        });

        for ( uint i = 0; i < election.candidates.length; i++ ) {
            election.score[_adrs[i]].add(sqrt(_votes[i]));
        }

        emit BallotCast(msg.sender);

    }

    function _payout(uint electionId) internal {

        Election storage election = elections[electionId]; 
        
        uint total; 
        for ( uint i = 0; i < election.candidates.length; i++) {
            total += election.result[election.candidates[i]];
        }

        console.log(total);

    }

    // Helpers
    function sqrt(uint x) internal pure returns (uint y) {

        uint z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }

    }

}
