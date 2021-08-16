pragma solidity ^0.8.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
import "@openzeppelin/contracts/access/AccessControl.sol";
import "prb-math/contracts/PRBMathSD59x18.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

contract YourContract is AccessControl {

  using PRBMathSD59x18 for int256;
  using SafeMath for uint; 
  
  struct Ballot {
    uint256 castAt;                         // Ballot cast block-timestamp
    int256[] votes;                         // Designated votes
  }

  struct Election {
    string note;                            // Creator title/notes/etc
    bool active;                            // Election status
    uint256 createdAt;                      // Creation block time-stamp
    address[] candidates;                   // Candidates (who can vote/be voted)
    uint256 allocatedFunds;
    int256 allocatedVotes;
    mapping (address => bool) voted;        // Voter status
    mapping (address => int256) scores;     // Voter to active-election score (sum of root votes)
    mapping (address => int256) results;    // Voter to closed-election result (score ** 2)
    mapping (address => Ballot) ballots;    // Voter to cast ballot
  }
  
  constructor() public {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  event BallotCast(address voter, uint electionId, address[] adrs, int256[] votes);
  event ElectionCreated(address creator, uint electionId);
  event ElectionEnded(uint electionId);

  bytes32 internal constant ELECTION_ADMIN_ROLE = keccak256("ELECTION_CREATOR_ROLE");
  bytes32 internal constant ELECTION_CANDIDATE_ROLE = keccak256("ELECTION_CANDIDATE_ROLE");

  uint numElections;
  mapping (uint => Election) public elections;

  modifier onlyContractAdmin() {
    require( hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Address not Contract Admin!" );
    _;
  }

  modifier onlyElectionCandidate() {
    require( hasRole(ELECTION_CANDIDATE_ROLE, msg.sender), "Address not Election Candidate!" );
    _;
  }
  
  modifier onlyElectionAdmin() {
    require( hasRole(ELECTION_ADMIN_ROLE, msg.sender), "Address not Election Admin!" );
    _;
  }


  function newElection(
    string memory _note, 
    uint256 _allocatedFunds, 
    int256 _allocatedVotes, 
    address[] memory _adrs
  ) public returns (uint electionId) {
    
    // NOTE: This does not check for future funds balance! (If multiple elections)
    require( _allocatedFunds <= address(this).balance,     "Not enough balance!" );

    electionId = numElections++; 
    Election storage election = elections[electionId];
    election.note = _note;
    election.allocatedFunds = _allocatedFunds;
    election.allocatedVotes = _allocatedVotes;
    election.candidates = _adrs;
    election.createdAt = block.timestamp;
    election.active = true;
    
    // Setup roles
    setElectionCandidateRoles(_adrs);
    setElectionAdminRole(msg.sender);

    emit ElectionCreated(msg.sender, electionId);

  }
  
  function endElection(uint electionId) public onlyElectionAdmin {

    Election storage election = elections[electionId];

    require( election.active, "Election Already Ended!" );

    for ( uint i = 0; i < election.candidates.length; i++ ) {
      address candidate = election.candidates[i];
      election.results[candidate] = PRBMathSD59x18.pow(election.scores[candidate], 2);
    }
    
    election.active = false;

    emit ElectionEnded(electionId);

  }

  function _deposit() public payable {
    
  }

  function _payout(uint electionId) internal {
    
  }

  function castBallot(
    uint electionId, 
    address[] memory _adrs, 
    int256[] memory _votes
  ) public onlyElectionCandidate {

    Election storage election = elections[electionId];
    _checkVote(election, _adrs, _votes); 

    election.ballots[msg.sender] = Ballot({
      castAt: block.timestamp, 
      votes: _votes
    }); 

    for ( uint i = 0; i < _adrs.length; i++ ) {
      election.scores[_adrs[i]] += PRBMathSD59x18.sqrt(_votes[i]);
    }

    election.voted[msg.sender] = true;

    emit BallotCast(msg.sender, electionId, _adrs, _votes);

  }
  
  // Check
  function _checkVote(
    Election storage election, 
    address[] memory _adrs, 
    int256[] memory _votes
  ) internal view {

    require( election.active,                      "Election Not Active!"   );
    require( _adrs.length == _votes.length,        "Address-Vote Mismatch!" );
    require( !election.voted[msg.sender],          "Address already voted!" );

    int256 voteSum = 0;

    for (uint i = 0; i < _adrs.length; i++) {

      require( _adrs[i] == election.candidates[i], "Address-Candidate Mismatch!" );
      require( _votes[i] >= 0,                     "Invalid Vote! Vote(s) < 0"   );
      
      voteSum += _votes[i];

    }

    require( voteSum == election.allocatedVotes, "Vote Miscount!" );

  }

  // Setters
  function setElectionCandidateRoles(address[] memory _adrs) internal {
    for ( uint i = 0; i < _adrs.length; i++ ) { 
      _setupRole(ELECTION_CANDIDATE_ROLE, _adrs[i]);
    }
  }

  function setElectionAdminRole(address adr) internal {
    _setupRole(ELECTION_ADMIN_ROLE, adr);
  }


  // Getters
  function getElectionResults(uint electionId, address _for) public view returns (int256) {
    require( !(elections[electionId].active), "Active election!" );
    return elections[electionId].results[_for];
  }

  function getElectionScore(uint electionId, address _for) public view returns (int256) {
    require( !(elections[electionId].active), "Active election!" );
    return elections[electionId].scores[_for]; 
  }

  function getElectionCastBallotVotes(uint electionId, address _for) public returns (int256[] memory) { 
    require( !(elections[electionId].active), "Active election!");
    return elections[electionId].ballots[_for].votes;
  }

  function getElectionCandidates(uint electionId) public view returns (address[] memory) {
    return elections[electionId].candidates;
  } 
  
  function getElectionVotedStatus(uint electionId, address _for) public view returns (bool) {
    return elections[electionId].voted[_for];
  }

  function getElectionVotedCount(uint electionId) public view returns (uint) {
    uint count = 0;
    for ( uint i = 0; i < elections[electionId].candidates.length; i++ ) {
      if ( elections[electionId].voted[elections[electionId].candidates[i]] == true ) { 
        count++; 
      }
    }
    return count;
  }

}