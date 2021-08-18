//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
import "@openzeppelin/contracts/access/AccessControl.sol";
import "prb-math/contracts/PRBMathSD59x18.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

contract Diplomacy is AccessControl {

  using PRBMathSD59x18 for int256;
  using SafeMath for uint; 
  
//   struct Ballot {
//     uint256 castAt;                         // Ballot cast block-timestamp
//     int256[] votes;                         // Designated votes
//   }

  struct Election {
    string name;                            // Creator title/names/etc
    bool active;                            // Election status
    uint256 createdAt;                      // Creation block time-stamp
    address[] candidates;                   // Candidates (who can vote/be voted)
    uint256 funds;
    int256 votes;
    mapping (address => bool) voted;        // Voter status
    mapping (address => int256) scores;     // Voter to active-election score (sum of root votes)
    mapping (address => int256) results;    // Voter to closed-election result (score ** 2)
    // mapping (address => Ballot) ballots;    // Voter to cast ballot
  }
  
  constructor() {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  event BallotCast(address voter, uint electionId, address[] adrs, int256[] votes);
  event ElectionCreated(address creator, uint electionId);
  event ElectionEnded(uint electionId);

  bytes32 internal constant ELECTION_ADMIN_ROLE = keccak256("ELECTION_CREATOR_ROLE");
  bytes32 internal constant ELECTION_CANDIDATE_ROLE = keccak256("ELECTION_CANDIDATE_ROLE");

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

    // election.ballots[msg.sender] = Ballot({
    //   castAt: block.timestamp, 
    //   votes: _votes
    // }); 

    for ( uint i = 0; i < _adrs.length; i++ ) {
      election.scores[_adrs[i]] += PRBMathSD59x18.sqrt(_votes[i]);
    }

    election.voted[msg.sender] = true;

    emit BallotCast(msg.sender, electionId, _adrs, _votes);

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

  // function _deposit() public payable {
    
  // }

  // function _payout(uint electionId) internal {
    
  // }

  
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

    require( voteSum == election.votes, "Vote Miscount!" );

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

  // // Getters


	function getElectionById(
        uint electionId
    ) public view returns (string memory name, uint n_addr, uint createdAt) {
		name = elections[electionId].name;
		n_addr = elections[electionId].candidates.length;
    createdAt = elections[electionId].createdAt;
	}

	
  function getElectionCandidates(uint electionId) public view returns (address[] memory) {
    return elections[electionId].candidates;
  }

  // function getElectionResults(uint electionId, address _for) public view returns (int256) {
  //   require( !(elections[electionId].active), "Active election!" );
  //   return elections[electionId].results[_for];
  // }

  // function getElectionScore(uint electionId, address _for) public view returns (int256) {
  //   require( !(elections[electionId].active), "Active election!" );
  //   return elections[electionId].scores[_for]; 
  // }

//   function getElectionCastBallotVotes(uint electionId, address _for) public returns (int256[] memory) { 
//     require( !(elections[electionId].active), "Active election!");
//     return elections[electionId].ballots[_for].votes;
//   }
 
  
  // function getElectionVotedStatus(uint electionId, address _for) public view returns (bool) {
  //   return elections[electionId].voted[_for];
  // }

  // function getElectionVotedCount(uint electionId) public view returns (uint) {
  //   uint count = 0;
  //   for ( uint i = 0; i < elections[electionId].candidates.length; i++ ) {
  //     if ( elections[electionId].voted[elections[electionId].candidates[i]] == true ) { 
  //       count++; 
  //     }
  //   }
  //   return count;
  // }

}
// pragma solidity ^0.8.0; 

// import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// import "@openzeppelin/contracts/access/AccessControl.sol";
// import "hardhat/console.sol";

// contract Diplomacy {

//     using SafeMath for uint;

//     // struct Ballot {
//     //     bool cast;
//     //     uint castAt;
//     // }

//     struct Election {
//         uint fund;
//         string name; 
//         bool active;
//         uint createdAt;
//         address[] candidates;
//         // mapping (address => Ballot) ballots;
//         mapping (address => uint) scores;
//         mapping (address => bool) voted;       
//         uint totalScoresSum;
//     }

//     mapping (uint => Election) elections; 

//     uint public numElections;

//     event ElectionCreated(address _sender, uint _electionId);
//     event BallotCast(address _sender, uint electionId, address[] adrs, uint[] votes);
//     event ElectionEnded(address _sender, uint _electionId);
    
//     function newElection(
//         string memory _name, 
//         uint _fund,
//         address[] memory _candidates
//     ) public returns (uint electionId) {
        
//         electionId = numElections += 1; 
//         Election storage election = elections[electionId];

//         election.fund = _fund;
//         election.name = _name; 
//         election.candidates = _candidates; 
//         election.active = true;
//         election.createdAt = block.timestamp;

//         emit ElectionCreated(msg.sender, electionId);

//     }

//     function castBallot(
//         uint electionId,
//         address[] memory _adrs, 
//         uint[] memory _votes
//     ) public { 

//         Election storage election = elections[electionId];

//         // Ballot storage ballot = election.ballots[msg.sender];

//         for ( uint i = 0; i < election.candidates.length; i++ ) {
//             election.scores[_adrs[i]] += sqrt(_votes[i]);
//             election.voted[_adrs[i]] = true;
//         }
        
//         // ballot.castAt = block.timestamp; 
//         // ballot.cast = true; 

//         emit BallotCast(msg.sender, electionId, _adrs, _votes);

//     }

//     function endElection(uint electionId) public {

//         Election storage election = elections[electionId];

//         //

//         // for ( uint i = 0; i < election.candidates.length; i++ ) {
//         //     address candidate = election.candidates[i];
//         //     election.resul[candidate] = election.score[candidate] * election.score[candidate];
//         // }
        
//         //_payout(electionId);

//         // uint totalScoresSum;

//         for ( uint i = 0; i < election.candidates.length; i++ ) {
//             address candidate = election.candidates[i];

//         }
        
//         election.active = false; 

//         emit ElectionEnded(msg.sender, electionId);

//     }

//     function _payout(uint electionId) internal {

//         // TODO: Fix this.
//         Election storage election = elections[electionId]; 
        
//         uint total; 
//         for ( uint i = 0; i < election.candidates.length; i++) {
//             // total += election.result[election.candidates[i]];
//         }

//         //mapping (address => uint) storage payRatio; 
//         for ( uint i = 0; i < election.candidates.length; i++ ) {
            
//         }

//         console.log(total);

//     }

//     // Helpers
//     function sqrt(uint x) internal pure returns (uint y) {

//         uint z = (x + 1) / 2;
//         y = x;
//         while (z < y) {
//             y = z;
//             z = (x / z + z) / 2;
//         }

//     }


// 	// function _deposit() public payable {
    
//   	// }

// }
