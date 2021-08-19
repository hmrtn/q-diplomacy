//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/access/AccessControl.sol";
import "prb-math/contracts/PRBMathSD59x18.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol"; 

contract Diplomacy is AccessControl {

  using PRBMathSD59x18 for int256;
  using SafeMath for uint; 
  
  struct Election {
    string name;                            // Creator title/names/etc
    bool active;                            // Election status
    uint256 createdAt;                      // Creation block time-stamp
    address[] candidates;                   // Candidates (who can vote/be voted)
    uint256 funds;
    int256 votes;
    address creator;
    mapping (address => bool) voted;        // Voter status
    mapping (address => int256) scores;     // Voter to active-election score (sum of root votes)
    mapping (address => int256) results;    // Voter to closed-election result (score ** 2)
  }
  
  constructor() {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  event BallotCast(address voter, uint electionId, address[] adrs, int256[] votes);
  event ElectionCreated(address creator, uint electionId);
  event ElectionEnded(uint electionId);
  event ElectionPaid(uint electionId);

  bytes32 internal constant ELECTION_ADMIN_ROLE = keccak256("ELECTION_CREATOR_ROLE");
  bytes32 internal constant ELECTION_CANDIDATE_ROLE = keccak256("ELECTION_CANDIDATE_ROLE");

  modifier onlyContractAdmin() {
    require( hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Sender not Contract Admin!" );
    _;
  }

  modifier onlyElectionCandidate() {
    require( hasRole(ELECTION_CANDIDATE_ROLE, msg.sender), "Sender not Election Candidate!" );
    _;
  }
  
  modifier onlyElectionAdmin() {
    require( hasRole(ELECTION_ADMIN_ROLE, msg.sender), "Sender not Election Admin!" );
    _;
  }

  uint public numElections;
  mapping (uint => Election) public elections;

  function newElection(
    string memory _name, 
    uint256 _funds, 
    int256 _votes, 
    address[] memory _adrs
  ) public returns (uint electionId) {
    
    // NOTE: This does not check for future funds balance! (If multiple elections)
    // require( _funds <= address(this).balance,     "Not enough balance!" );

    electionId = numElections++; 
    Election storage election = elections[electionId];
    election.name = _name;
    election.funds = _funds;
    election.votes = _votes;
    election.candidates = _adrs;
    election.createdAt = block.timestamp;
    election.active = true;
	election.creator = msg.sender;
    
    // Setup roles
    setElectionCandidateRoles(_adrs);
    setElectionAdminRole(msg.sender);

    emit ElectionCreated(msg.sender, electionId);

  }
  
  function castBallot(
    uint electionId, 
    address[] memory _adrs, 
    int256[] memory _votes
  ) public onlyElectionCandidate {

    Election storage election = elections[electionId];
    _checkVote(election, _adrs, _votes); 

    for ( uint i = 0; i < _adrs.length; i++ ) {
      election.scores[_adrs[i]] += _votes[i]; //PRBMathSD59x18.sqrt(_votes[i]);
    }

    election.voted[msg.sender] = true;

    emit BallotCast(msg.sender, electionId, _adrs, _votes);

  }
  
  function endElection(uint electionId) public onlyElectionAdmin {

    Election storage election = elections[electionId];

    require( election.active, "Election Already Ended!" );

    // for ( uint i = 0; i < election.candidates.length; i++ ) {
    //   address candidate = election.candidates[i];
    //   election.results[candidate] = PRBMathSD59x18.pow(election.scores[candidate], 2);
    // }
    
    election.active = false;

    emit ElectionEnded(electionId);

  }

  function payoutElection(uint electionId, address[] memory _adrs, uint[] memory _pay) public payable {

    require( !elections[electionId].active, "Election Still Active!" );

    uint paySum;
    for ( uint i = 0; i < elections[electionId].candidates.length; i++ ) {
      require( elections[electionId].candidates[i] == _adrs[i], "Election-Address Mismatch!" );
      paySum += _pay[i]; 
    }

    // require( paySum == elections[electionId].funds,  "Payout-Election Funds Mismatch!" ); 
    require( paySum <= msg.sender.balance, "Sender does not have enough funds!" );    
    // require( msg.value == elections[electionId].funds, "Sender Payout-Funds Mismatch!" ); 

    for ( uint i = 0; i < _pay.length; i++ ) {//elections[electionId].candidates.length; i++ ) {
      payable(_adrs[i]).transfer(_pay[i] * 1 wei);
    }

    emit ElectionPaid(electionId);
  }

  
  // Check
  function _checkVote(
    Election storage election, 
    address[] memory _adrs, 
    int256[] memory _votes
  ) internal view {

    require( election.active,                      "Election Not Active!"   );
    require( _adrs.length == _votes.length,        "Address-Vote Mismatch!" );
    require( !election.voted[msg.sender],          "Sender already voted!"  );

    int256 voteSum = 0;

    for (uint i = 0; i < _adrs.length; i++) {

      require( _adrs[i] == election.candidates[i], "Address-Candidate Mismatch!" );
      require( _votes[i] >= 0,                     "Invalid Vote! Vote(s) < 0"   );
      
      voteSum += _votes[i];

    }

    require( voteSum == election.votes, "Vote Miscount!" );

  }

  // Setters
  function setElectionCandidateRoles(address[] memory _adrs) internal {
    for ( uint i = 0; i < _adrs.length; i++ ) { 
      _setupRole(ELECTION_CANDIDATE_ROLE, _adrs[i]);
    }
  }

  function setElectionAdminRole(address adr) public {
    _setupRole(ELECTION_ADMIN_ROLE, adr);
  }

  // Getters
	function getElectionById(uint electionId) public view returns (
      string memory name, 
      address[] memory candidates,
      uint n_addr, 
      uint createdAt,
      uint256 funds,
      int256 votes, 
      address creator,
	  bool isActive
  ) {
		name = elections[electionId].name;
    	candidates = elections[electionId].candidates;
		n_addr = elections[electionId].candidates.length;
    	createdAt = elections[electionId].createdAt;
    	funds = elections[electionId].funds;
    	votes = elections[electionId].votes;
      	creator = elections[electionId].creator;
		isActive = elections[electionId].active;
	}

  function getElectionScore(uint electionId, address _adr) public view returns (int256){
    return elections[electionId].scores[_adr];
  }

  function getElectionResults(uint electionId, address _adr) public view returns (int256) {
    // require( !(elections[electionId].active), "Active election!" );
    return elections[electionId].results[_adr];
  }

  function getElectionVoted(uint electionId) public view returns(uint count) {
    for ( uint i = 0; i < elections[electionId].candidates.length; i++ ) {
      address candidate = elections[electionId].candidates[i];
      if ( elections[electionId].voted[candidate] ) {
        count++;
      }
    }
  }

  function canVote(uint electionId, address _sender) public view returns (bool status) {
    for ( uint i = 0; i < elections[electionId].candidates.length; i++ ) {
      address candidate = elections[electionId].candidates[i];
      if ( _sender == candidate ) {
        status = true;
      }
    }
  }

  function isElectionAdmin(uint electionId, address _sender) public view returns (bool) {
    return _sender == elections[electionId].creator;
  }

  function hasVoted(uint electionId, address _sender) public view returns (bool) {
    return elections[electionId].voted[_sender];
  }

}