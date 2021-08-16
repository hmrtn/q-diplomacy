pragma solidity >=0.6.0 <0.8.0;
//SPDX-License-Identifier: MIT

import "prb-math/contracts/PRBMathSD59x18.sol";
import "hardhat/console.sol";
//import "@openzeppelin/contracts/access/Ownable.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
//import "@openzeppelin/contracts/math/SafeMath.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
//import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract YourContract {
  
  using PRBMathSD59x18 for int256;
  
  struct Ballot {
    uint256 castAt;                         // Ballot cast block-timestamp
    int256[] votes;                         // Designated votes
  }

  struct Election {
    string note;                            // Creator title/notes/etc
    bool active;                            // Election status
    uint256 createdAt;                      // Creation block time-stamp
    address[] candidates;                   // Candidates (who can vote/be voted)
    mapping (address => bool) voted;        // Voter status
    mapping (address => int256) scores;     // Voter to active-election score (sum of root votes)
    mapping (address => int256) results;    // Voter to closed-election result (score ** 2)
    mapping (address => Ballot) ballots;    // Voter to cast ballot
  }

  uint numElections;
  mapping (uint => Election) public elections;

  function newElection(string memory _note, address[] memory _adrs) public returns (uint electionId) {

    electionId = numElections++; 
    Election storage election = elections[electionId];
    election.note = _note;
    election.candidates = _adrs;
    election.createdAt = block.timestamp;
    election.active = true;

  }
  
  function endElection(uint electionId) public {

    Election storage election = elections[electionId];

    require( election.active, "Election Already Ended!" );

    for (uint i = 0; i < election.candidates.length; i++) {
      address candidate = election.candidates[i];
      election.results[candidate] = PRBMathSD59x18.pow(election.scores[candidate], 2);
    }
    
    election.active = false;

  }

  function _deposit() public payable {
    
  }

  function _payout(uint electionId) internal {
    
  }

  function vote(uint electionId, address[] memory _adrs, int256[] memory _votes) public {

    Election storage election = elections[electionId];
    _checkVote(election, _adrs, _votes); 

    election.ballots[msg.sender] = Ballot({
      castAt: block.timestamp, 
      votes: _votes
    }); 

    for (uint i = 0; i < _adrs.length; i++) {
      election.scores[_adrs[i]] += PRBMathSD59x18.sqrt(_votes[i]);
    }

    election.voted[msg.sender] = true;

  }
  
  // Check
  function _checkVote(Election storage election, address[] memory _adrs, int256[] memory _votes) internal view {

    require( election.active,                      "Election Not Active!"   );
    require( _adrs.length == _votes.length,        "Address-Vote Mismatch!" );
    require( !election.voted[msg.sender],          "Address already voted!" );

    bool isElectionCandidate;

    for (uint i = 0; i < _adrs.length; i++) {

      require( _adrs[i] == election.candidates[i], "Address-Candidate Mismatch!" );
      require( _votes[i] >= 0,                     "Invalid Vote!"               );
      
      if (msg.sender == election.candidates[i]) { isElectionCandidate = true; }

    }

    require( isElectionCandidate, "Invalid Election Participant!" );

  }

  // Helpers
  function getElectionResults(uint electionId, address _for) public returns (int256) {
    require( !(elections[electionId].active), "Active election!" );
    return elections[electionId].results[_for];
  }

  function getElectionScore(uint electionId, address _for) public returns (int256) {
    require( !(elections[electionId].active), "Active election!" );
    return elections[electionId].scores[_for]; 
  }

  function getElectionBallotVotes(uint electionId, address _for) public returns (int256[] memory) { 
    require( !(elections[electionId].active), "Active election!");
    return elections[electionId].ballots[_for].votes;
  }

  function getElectionCandidates(uint electionId) public view returns (address[] memory) {
    return elections[electionId].candidates;
  } 
  
  function getElectionVoteStatus(uint electionId, address _for) public view returns (bool) {
    return elections[electionId].voted[_for];
  }

}
